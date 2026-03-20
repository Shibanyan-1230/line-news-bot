// ============================================
// LINE Webhook ハンドラー（ユーザー操作の処理）
// ============================================

import { config } from "../config";
import { saveArticle, getRecentArticles } from "./notionService";
import { fetchAllNews } from "./newsService";
import { fetchMarketData } from "./marketService";
import { formatNewsMessage } from "../formatter";
import { sendLineMessage } from "./lineService";

// --------------------------------------------------
// ユーザーごとの会話状態管理（シンプルなインメモリ）
// --------------------------------------------------
interface UserState {
  mode: "idle" | "waiting_url" | "waiting_memo";
  url?: string;
}

const userStates = new Map<string, UserState>();

function getState(userId: string): UserState {
  return userStates.get(userId) || { mode: "idle" };
}

function setState(userId: string, state: UserState): void {
  userStates.set(userId, state);
}

function resetState(userId: string): void {
  userStates.delete(userId);
}

// --------------------------------------------------
// Webhook署名検証
// --------------------------------------------------
export function verifySignature(
  body: string,
  signature: string
): boolean {
  const crypto = require("crypto");
  const channelSecret = config.line.channelSecret();
  const hash = crypto
    .createHmac("SHA256", channelSecret)
    .update(body)
    .digest("base64");
  return hash === signature;
}

// --------------------------------------------------
// Webhookイベント処理
// --------------------------------------------------
export async function handleWebhookEvent(event: any): Promise<void> {
  // テキストメッセージのみ処理
  if (event.type !== "message" || event.message?.type !== "text") {
    // ポストバックイベント（リッチメニューなど）
    if (event.type === "postback") {
      await handlePostback(event);
    }
    return;
  }

  const userId = event.source?.userId;
  if (!userId) return;

  const text = event.message.text.trim();
  const replyToken = event.replyToken;

  const state = getState(userId);

  switch (state.mode) {
    case "waiting_url":
      await handleUrlInput(userId, text, replyToken);
      break;
    case "waiting_memo":
      await handleMemoInput(userId, text, replyToken);
      break;
    default:
      await handleCommand(userId, text, replyToken);
      break;
  }
}

// --------------------------------------------------
// コマンド処理
// --------------------------------------------------
async function handleCommand(
  userId: string,
  text: string,
  replyToken: string
): Promise<void> {
  // URLが直接送られた場合 → 保存フローへ
  if (text.startsWith("http://") || text.startsWith("https://")) {
    setState(userId, { mode: "waiting_memo", url: text });
    await reply(replyToken, `記事を保存します。\n\nメモを入力してください。\n（不要なら「なし」と送信）`);
    return;
  }

  switch (text) {
    case "保存":
    case "記事を保存":
      setState(userId, { mode: "waiting_url" });
      await reply(replyToken, "保存する記事のURLを送ってください。");
      break;

    case "リスト":
    case "保存リスト":
      await handleShowList(replyToken);
      break;

    case "ニュース":
    case "最新ニュース":
      await handleFetchNews(replyToken);
      break;

    default:
      await reply(
        replyToken,
        `メニューから選択するか、以下を送信してください。\n\n・「ニュース」→ 最新ニュース取得\n・「保存」→ 記事を保存\n・「リスト」→ 保存した記事一覧\n・URLを直接送信 → 記事を保存`
      );
      break;
  }
}

// --------------------------------------------------
// ポストバック処理（リッチメニューから）
// --------------------------------------------------
async function handlePostback(event: any): Promise<void> {
  const userId = event.source?.userId;
  const data = event.postback?.data;
  const replyToken = event.replyToken;

  if (!userId || !data || !replyToken) return;

  switch (data) {
    case "action=news":
      await handleFetchNews(replyToken);
      break;
    case "action=save":
      setState(userId, { mode: "waiting_url" });
      await reply(replyToken, "保存する記事のURLを送ってください。");
      break;
    case "action=list":
      await handleShowList(replyToken);
      break;
  }
}

// --------------------------------------------------
// URL入力処理
// --------------------------------------------------
async function handleUrlInput(
  userId: string,
  text: string,
  replyToken: string
): Promise<void> {
  if (text === "キャンセル" || text === "やめる") {
    resetState(userId);
    await reply(replyToken, "保存をキャンセルしました。");
    return;
  }

  if (!text.startsWith("http://") && !text.startsWith("https://")) {
    await reply(replyToken, "URLを入力してください。\n（キャンセルする場合は「キャンセル」と送信）");
    return;
  }

  setState(userId, { mode: "waiting_memo", url: text });
  await reply(replyToken, `メモを入力してください。\n（不要なら「なし」と送信）`);
}

// --------------------------------------------------
// メモ入力処理
// --------------------------------------------------
async function handleMemoInput(
  userId: string,
  text: string,
  replyToken: string
): Promise<void> {
  const state = getState(userId);
  const url = state.url!;
  const memo = text === "なし" || text === "スキップ" ? "" : text;

  try {
    await saveArticle(url, memo);
    resetState(userId);
    await reply(replyToken, `Notionに保存しました!\n${memo ? `メモ: ${memo}` : ""}`);
  } catch (error) {
    console.error("[ERROR] Notion保存失敗:", error);
    resetState(userId);
    await reply(replyToken, "保存に失敗しました。設定を確認してください。");
  }
}

// --------------------------------------------------
// ニュース取得
// --------------------------------------------------
async function handleFetchNews(replyToken: string): Promise<void> {
  await reply(replyToken, "ニュースを取得中...");

  try {
    const [allNews, marketData] = await Promise.all([
      fetchAllNews(),
      fetchMarketData(),
    ]);
    const message = formatNewsMessage(allNews, marketData);
    // replyTokenは使用済みなのでpush送信
    await sendLineMessage(message);
  } catch (error) {
    console.error("[ERROR] ニュース取得失敗:", error);
  }
}

// --------------------------------------------------
// 保存リスト表示
// --------------------------------------------------
async function handleShowList(replyToken: string): Promise<void> {
  try {
    const articles = await getRecentArticles();

    if (articles.length === 0) {
      await reply(replyToken, "保存した記事はまだありません。");
      return;
    }

    const lines = ["📋 保存した記事（直近10件）", ""];
    for (const a of articles) {
      const title = a.title.length > 30 ? a.title.slice(0, 30) + "…" : a.title;
      lines.push(`・${title}`);
      if (a.memo) lines.push(`  💬 ${a.memo}`);
      lines.push(`  ${a.url}`);
      lines.push("");
    }

    await reply(replyToken, lines.join("\n").trim());
  } catch (error) {
    console.error("[ERROR] リスト取得失敗:", error);
    await reply(replyToken, "リストの取得に失敗しました。");
  }
}

// --------------------------------------------------
// LINE Reply API
// --------------------------------------------------
async function reply(replyToken: string, text: string): Promise<void> {
  const token = config.line.channelAccessToken();
  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text }],
    }),
  });
}
