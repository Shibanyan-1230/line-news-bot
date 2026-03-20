// ============================================
// メインエントリ（Webhook + Cron + ヘルスチェック）
// ============================================

import express from "express";
import cron from "node-cron";
import { config } from "./config";
import { fetchAllNews } from "./services/newsService";
import { fetchMarketData } from "./services/marketService";
import { sendLineMessage } from "./services/lineService";
import { formatNewsMessage } from "./formatter";
import { handleWebhookEvent, verifySignature } from "./services/webhookHandler";
import { setupRichMenu } from "./services/richMenuService";

// --------------------------------------------------
// ニュース取得・送信ジョブ（毎朝自動配信）
// --------------------------------------------------
async function executeJob(): Promise<void> {
  const startTime = Date.now();
  console.log(`[INFO] ジョブ開始: ${new Date().toISOString()}`);

  try {
    const [allNews, marketData] = await Promise.all([
      fetchAllNews(),
      fetchMarketData(),
    ]);

    const message = formatNewsMessage(allNews, marketData);

    console.log("[INFO] 送信メッセージ:");
    console.log(message);
    console.log("---");

    await sendLineMessage(message);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[INFO] ジョブ完了 (${elapsed}秒)`);
  } catch (error) {
    console.error("[ERROR] ジョブ失敗:");
    console.error(error);
  }
}

// --------------------------------------------------
// Cronスケジュール登録
// --------------------------------------------------
const schedule = config.cronSchedule;

cron.schedule(schedule, executeJob, {
  timezone: "Asia/Tokyo",
});

// --------------------------------------------------
// Express サーバー
// --------------------------------------------------
const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

// Webhook用: rawBodyを保持するため、jsonパーサーの前にrawBodyを取得
app.use("/webhook", express.raw({ type: "*/*" }));
app.use(express.json());

// ヘルスチェック
app.get("/", (_req, res) => {
  res.json({
    status: "running",
    schedule,
    timezone: "Asia/Tokyo",
    uptime: `${Math.floor(process.uptime())}s`,
  });
});

// 手動トリガー
app.get("/trigger", async (_req, res) => {
  res.json({ message: "ジョブを実行中..." });
  await executeJob();
});

// LINE Webhook エンドポイント
app.post("/webhook", async (req, res) => {
  const signature = req.headers["x-line-signature"] as string;
  const body = req.body.toString("utf-8");

  // 署名検証
  if (!signature || !verifySignature(body, signature)) {
    console.warn("[WARN] Webhook署名検証失敗");
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  // 即座に200を返す（LINEは3秒以内にレスポンスを要求）
  res.status(200).json({ ok: true });

  // イベント処理（非同期）
  try {
    const parsed = JSON.parse(body);
    const events = parsed.events || [];
    for (const event of events) {
      await handleWebhookEvent(event);
    }
  } catch (error) {
    console.error("[ERROR] Webhook処理失敗:", error);
  }
});

// リッチメニュー設定エンドポイント（初回セットアップ用）
app.get("/setup-menu", async (_req, res) => {
  try {
    await setupRichMenu();
    res.json({ message: "リッチメニュー設定完了" });
  } catch (error) {
    console.error("[ERROR] リッチメニュー設定失敗:", error);
    res.status(500).json({ error: "設定失敗" });
  }
});

app.listen(PORT, () => {
  console.log(`[INFO] LINE News Bot 起動`);
  console.log(`[INFO] Cronスケジュール: ${schedule} (Asia/Tokyo)`);
  console.log(`[INFO] ヘルスチェック: http://localhost:${PORT}/`);
  console.log(`[INFO] Webhook: http://localhost:${PORT}/webhook`);
  console.log(`[INFO] 手動実行: http://localhost:${PORT}/trigger`);
  console.log(`[INFO] メニュー設定: http://localhost:${PORT}/setup-menu`);
  console.log("[INFO] 次回実行を待機中...");
});
