// ============================================
// ニュース取得・整理サービス
// ============================================

import Parser from "rss-parser";
import { categories, CategoryFeeds, FeedSource } from "../feeds";

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

// --------------------------------------------------
// スポーツ記事ブロックリスト（安全ネット）
// Google Newsのクエリ除外で漏れたものをここで除去
// --------------------------------------------------
const NOISE_BLOCKLIST = [
  // スポーツ
  "スポーツ", "野球", "サッカー", "陸上", "マラソン", "駅伝",
  "選手権", "試合結果", "優勝", "準優勝", "プロ野球",
  "Jリーグ", "五輪", "オリンピック", "パラリンピック",
  "ゴルフ", "テニス", "バスケ", "ラグビー", "バレーボール",
  "クロカン", "水泳", "柔道", "体操", "甲子園",
  // 食品・スイーツ（ロイズ=ROYCE'チョコ対策）
  "スイーツ", "チョコ", "ケーキ", "お菓子", "移動販売",
  "グルメ", "レシピ", "カフェ",
  // 投資信託・年金（保険と無関係な金融商品）
  "インデックスファンド", "投資信託", "ETF", "厚生年金",
  "国民年金", "iDeCo", "NISA", "国債",
  // 年金（公的年金。個人年金保険とは区別）
  "年金請求", "年金受給", "年金支給", "年金額",
  // その他ノイズ
  "充電器", "充電ステーション", "プライム市場",
  "インパクト銘柄",
];

// --------------------------------------------------
// URLキャッシュ（同一URLを2回取得しない）
// --------------------------------------------------
const urlCache = new Map<string, NewsItem[]>();

function clearCache(): void {
  urlCache.clear();
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
 * スポーツ記事かどうか判定
 */
function isNoiseArticle(title: string): boolean {
  return NOISE_BLOCKLIST.some((word) => title.includes(word));
}

/**
 * キーワードフィルタ: タイトルにいずれかのキーワードを含むか
 */
function matchesKeywords(title: string, keywords: string[]): boolean {
  const lower = title.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

/**
 * タイトルの正規化（重複判定用）
 * Google Newsは「タイトル - メディア名」形式なのでメディア名を除去
 */
function normalizeTitle(title: string): string {
  return title
    .replace(/\s*[-–—|]\s*[^\-–—|]+$/, "") // 末尾のメディア名除去
    .replace(/[、，､,。．.]/g, "")           // 句読点を統一
    .replace(/\s+/g, "")
    .toLowerCase();
}

/**
 * 重複記事を除外する
 * 完全一致 + 先頭20文字一致で重複とみなす
 * （同じニュースが別メディアで微妙に異なるタイトルで配信されるため）
 */
function deduplicateNews(items: NewsItem[]): NewsItem[] {
  const seenFull = new Set<string>();
  const seenPrefix = new Set<string>();
  return items.filter((item) => {
    const normalized = normalizeTitle(item.title);
    if (normalized.length < 5) return false;
    if (seenFull.has(normalized)) return false;
    // 先頭20文字が同じ → 同じニュースの別ソースとみなす
    const prefix = normalized.slice(0, 20);
    if (seenPrefix.has(prefix)) return false;
    seenFull.add(normalized);
    seenPrefix.add(prefix);
    return true;
  });
}

/**
 * 単一フィードからニュースを取得（キャッシュ付き）
 */
async function fetchFeedRaw(
  feedUrl: string,
  sourceName: string
): Promise<NewsItem[]> {
  // キャッシュヒット
  if (urlCache.has(feedUrl)) {
    return urlCache.get(feedUrl)!;
  }

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

      if (!isWithin24Hours(pubDate)) continue;

      items.push({
        title: entry.title.trim(),
        url: entry.link,
        publishedAt: pubDate,
        source: sourceName,
      });
    }

    urlCache.set(feedUrl, items);
    return items;
  } catch (error) {
    console.error(`[ERROR] フィード取得失敗: ${sourceName}`);
    console.error(error instanceof Error ? error.message : error);
    urlCache.set(feedUrl, []);
    return [];
  }
}

/**
 * 1フィードから記事を取得し、キーワード＋スポーツフィルタを適用
 */
async function fetchFeedFiltered(feed: FeedSource): Promise<NewsItem[]> {
  let items = await fetchFeedRaw(feed.url, feed.name);

  // キーワードフィルタ（設定されている場合のみ）
  if (feed.keywords) {
    items = items.filter((item) => matchesKeywords(item.title, feed.keywords!));
  }

  // スポーツ除外
  items = items.filter((item) => !isNoiseArticle(item.title));

  return items;
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
    category.feeds.map((feed) => fetchFeedFiltered(feed))
  );

  for (const items of results) {
    allItems.push(...items);
  }

  // 新しい順にソート
  allItems.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

  // 重複除外 → 上位5件
  const unique = deduplicateNews(allItems);

  return {
    label: category.label,
    items: unique.slice(0, 5),
  };
}

/**
 * 全カテゴリのニュースを取得（メインエントリ）
 */
export async function fetchAllNews(): Promise<CategoryNews[]> {
  clearCache();
  console.log("[INFO] ニュース取得開始...");

  const results = await Promise.all(categories.map(fetchCategoryNews));

  for (const cat of results) {
    console.log(`[INFO] ${cat.label}: ${cat.items.length}件取得`);
  }

  console.log(`[INFO] フィード取得数: ${urlCache.size}件（キャッシュ）`);
  return results;
}
