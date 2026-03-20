// ============================================
// Notion API サービス（記事保存・一覧取得）
// ============================================

import { Client } from "@notionhq/client";
import { config } from "../config";

let client: Client | null = null;

function getClient(): Client {
  if (!client) {
    client = new Client({ auth: config.notion.apiKey() });
  }
  return client;
}

export interface SavedArticle {
  title: string;
  url: string;
  memo: string;
  savedAt: string;
}

/**
 * 記事をNotionデータベースに保存
 */
export async function saveArticle(
  url: string,
  memo: string
): Promise<void> {
  const notion = getClient();
  const databaseId = config.notion.databaseId();

  // URLからページタイトルを取得
  let title = url;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "LINE-News-Bot/1.0",
        "Accept": "text/html",
        "Accept-Charset": "utf-8",
      },
      signal: AbortSignal.timeout(5000),
    });
    const buffer = await res.arrayBuffer();
    // UTF-8でデコード
    const html = new TextDecoder("utf-8").decode(buffer);
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (match?.[1]) {
      // HTMLエンティティをデコード
      title = match[1]
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim()
        .slice(0, 100);
    }
  } catch {
    // タイトル取得失敗時はURLをそのまま使用
  }

  const today = new Date().toISOString().split("T")[0];

  await notion.pages.create({
    parent: { database_id: databaseId },
    properties: {
      タイトル: {
        title: [{ text: { content: title } }],
      },
      URL: {
        url: url,
      },
      メモ: {
        rich_text: [{ text: { content: memo || "" } }],
      },
      保存日: {
        date: { start: today },
      },
    },
  });

  console.log(`[INFO] Notion保存完了: ${title}`);
}

/**
 * 保存済み記事の一覧を取得（直近10件）
 */
export async function getRecentArticles(): Promise<SavedArticle[]> {
  const notion = getClient();
  const databaseId = config.notion.databaseId();

  const response = await notion.databases.query({
    database_id: databaseId,
    sorts: [{ property: "保存日", direction: "descending" }],
    page_size: 10,
  });

  return response.results.map((page: any) => {
    const props = page.properties;
    return {
      title: props.タイトル?.title?.[0]?.text?.content || "（無題）",
      url: props.URL?.url || "",
      memo: props.メモ?.rich_text?.[0]?.text?.content || "",
      savedAt: props.保存日?.date?.start || "",
    };
  });
}
