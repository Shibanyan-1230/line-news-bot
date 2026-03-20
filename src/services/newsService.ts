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

const NOISE_BLOCKLIST = [
  "スポーツ", "野球", "サッカー", "陸上", "マラソン", "駅伝",
  "選手権", "試合結果", "優勝", "準優勝", "プロ野球",
  "Jリーグ", "五輪", "オリンピック", "パラリンピック",
  "ゴルフ", "テニス", "バスケ", "ラグビー", "バレーボール",
  "クロカン", "水泳", "柔道", "体操", "甲子園",
  "スイーツ", "チョコ", "ケーキ", "お菓子", "移動販売",
  "グルメ", "レシピ", "カフェ",
];

const urlCache = new Map<string, NewsItem[]>();

function clearCache(): void {
  urlCache.clear();
}

function isWithin24Hours(date: Date): boolean {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return diff >= 0 && diff <= 24 * 60 * 60 * 1000;
}

function isNoiseArticle(title: string): boolean {
  return NOISE_BLOCKLIST.some((word) => title.includes(word));
}

function matchesKeywords(title: string, keywords: string[]): boolean {
  const lower = title.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

function normalizeTitle(title: string): string {
  return title
    .replace(/\s*[-–—|]\s*[^\-–—|]+$/, "")
    .replace(/[、，､,。．.]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function deduplicateNews(items: NewsItem[]): NewsItem[] {
  const seenFull = new Set<string>();
  const seenPrefix = new Set<string>();
  return items.filter((item) => {
    const normalized = normalizeTitle(item.title);
    if (normalized.length < 5) return false;
    if (seenFull.has(normalized)) return false;
    const prefix = normalized.slice(0, 20);
    if (seenPrefix.has(prefix)) return false;
    seenFull.add(normalized);
    seenPrefix.add(prefix);
    return true;
  });
}

async function fetchFeedRaw(
  feedUrl: string,
  sourceName: string
): Promise<NewsItem[]> {
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

async function fetchFeedFiltered(feed: FeedSource): Promise<NewsItem[]> {
  let items = await fetchFeedRaw(feed.url, feed.name);

  if (feed.keywords) {
    items = items.filter((item) => matchesKeywords(item.title, feed.keywords!));
  }

  items = items.filter((item) => !isNoiseArticle(item.title));

  return items;
}

async function fetchCategoryNews(
  category: CategoryFeeds
): Promise<CategoryNews> {
  const allItems: NewsItem[] = [];

  const results = await Promise.all(
    category.feeds.map((feed) => fetchFeedFiltered(feed))
  );

  for (const items of results) {
    allItems.push(...items);
  }

  allItems.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

  const unique = deduplicateNews(allItems);

  return {
    label: category.label,
    items: unique.slice(0, 5),
  };
}

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
