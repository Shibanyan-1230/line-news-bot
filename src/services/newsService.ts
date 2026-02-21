// ============================================
// ニュース取得・整理サービス
// ============================================

import Parser from "rss-parser";
import { categories, CategoryFeeds } from "../feeds";

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "LINE-News-Bot/1.0",
    Accept: "application/rss+xml, application/xml, text/xml",
  },
});

export interface NewsItem {
  title: string;
  url: string;
  publishedAt: Date;
  source: string;
}

export interface CategoryNews {
  label: string;
  items: NewsItem[];
}

/**
 * 直近24時間以内の記事かどうか判定
 */
function isWithin24Hours(date: Date): boolean {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return diff >= 0 && diff <= 24 * 60 * 60 * 1000;
}

/**
 * タイトルの正規化（重複判定用）
 * Google Newsは「タイトル - メディア名」形式なのでメディア名を除去
 */
function normalizeTitle(title: string): string {
  return title
    .replace(/\s*[-–—|]\s*[^\-–—|]+$/, "") // 末尾のメディア名除去
    .replace(/\s+/g, "")
    .toLowerCase();
}

/**
 * 重複記事を除外する
 * 正規化したタイトルが同じものを重複とみなす
 */
function deduplicateNews(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const normalized = normalizeTitle(item.title);
    // 短すぎるタイトルはスキップ
    if (normalized.length < 5) return false;
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

/**
 * 単一フィードからニュースを取得
 */
async function fetchFeed(
  feedUrl: string,
  sourceName: string
): Promise<NewsItem[]> {
  try {
    const feed = await parser.parseURL(feedUrl);
    const items: NewsItem[] = [];

    for (const entry of feed.items) {
      if (!entry.title || !entry.link) continue;

      const pubDate = entry.pubDate
        ? new Date(entry.pubDate)
        : entry.isoDate
          ? new Date(entry.isoDate)
          : new Date();

      // 直近24時間以内の記事のみ
      if (!isWithin24Hours(pubDate)) continue;

      // Google NewsのリダイレクトURLはそのまま使用
      // （クリック時に実際の記事に転送される）
      items.push({
        title: entry.title.trim(),
        url: entry.link,
        publishedAt: pubDate,
        source: sourceName,
      });
    }

    return items;
  } catch (error) {
    console.error(`[ERROR] フィード取得失敗: ${sourceName} (${feedUrl})`);
    console.error(error instanceof Error ? error.message : error);
    return [];
  }
}

/**
 * 1カテゴリ分のニュースを取得
 */
async function fetchCategoryNews(
  category: CategoryFeeds
): Promise<CategoryNews> {
  const allItems: NewsItem[] = [];

  // カテゴリ内の全フィードを並行取得
  const results = await Promise.all(
    category.feeds.map((feed) => fetchFeed(feed.url, feed.name))
  );

  for (const items of results) {
    allItems.push(...items);
  }

  // 新しい順にソート
  allItems.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

  // 重複除外
  const unique = deduplicateNews(allItems);

  // 上位5件に絞る
  return {
    label: category.label,
    items: unique.slice(0, 5),
  };
}

/**
 * 全カテゴリのニュースを取得（メインエントリ）
 */
export async function fetchAllNews(): Promise<CategoryNews[]> {
  console.log("[INFO] ニュース取得開始...");

  // 全カテゴリを並行取得
  const results = await Promise.all(categories.map(fetchCategoryNews));

  for (const cat of results) {
    console.log(`[INFO] ${cat.label}: ${cat.items.length}件取得`);
  }

  return results;
}
