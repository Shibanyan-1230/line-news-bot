// ============================================
// RSSフィード定義（保険業界特化・多ソース）
// ============================================

export interface FeedSource {
  name: string;
  url: string;
  /** 設定時、記事タイトルにいずれかのキーワードを含む場合のみ採用 */
  keywords?: string[];
}

export interface CategoryFeeds {
  label: string;
  feeds: FeedSource[];
}

// --------------------------------------------------
// Google News RSS ヘルパー
// --------------------------------------------------
const SPORTS_EXCLUDE =
  "-スポーツ -野球 -サッカー -陸上 -マラソン -駅伝 -選手権 -五輪 -試合 -優勝 -クロカン";

function googleNewsRSS(query: string): string {
  const full = query + " " + SPORTS_EXCLUDE + " when:1d";
  return `https://news.google.com/rss/search?q=${encodeURIComponent(full)}&hl=ja&gl=JP&ceid=JP:ja`;
}

// --------------------------------------------------
// キーワードフィルタ（汎用ニュースから保険記事を抽出）
// --------------------------------------------------
export const LIFE_KEYWORDS = [
  "生命保険", "生保", "日本生命", "第一生命", "明治安田生命",
  "明治安田", "住友生命", "かんぽ生命", "メットライフ",
  "プルデンシャル", "アフラック", "ソニー生命",
  "オリックス生命", "SBI生命", "ライフネット生命",
  "太陽生命", "朝日生命", "大同生命", "富国生命",
];

export const NONLIFE_KEYWORDS = [
  "損害保険", "損保", "東京海上", "損保ジャパン", "三井住友海上",
  "あいおいニッセイ", "SOMPO", "ソンポ", "再保険",
  "自動車保険", "火災保険", "地震保険", "傷害保険",
  "AIG", "アリアンツ", "Lloyd",
  "reinsur", "P&C", "insurance journal",
  "catastrophe", "cat bond",
];

// --------------------------------------------------
// カテゴリ定義
// --------------------------------------------------
export const categories: CategoryFeeds[] = [
  {
    label: "生命保険",
    feeds: [
      // --- Google News（スポーツ除外済み）---
      {
        name: "Google News - 国内生保",
        url: googleNewsRSS(
          "生命保険 OR 生保 OR 日本生命 OR 第一生命 OR 明治安田生命 OR 住友生命"
        ),
      },
      {
        name: "Google News - 外資生保",
        url: googleNewsRSS(
          "メットライフ OR プルデンシャル OR アフラック OR かんぽ生命 OR ソニー生命"
        ),
      },
      // --- 保険専門メディア ---
      {
        name: "保険毎日新聞",
        url: "https://homai.co.jp/news/feed/",
        keywords: LIFE_KEYWORDS,
      },
      {
        name: "新日本保険新聞",
        url: "https://www.shinnihon-ins.co.jp/industry-news/feed/",
        keywords: LIFE_KEYWORDS,
      },
      // --- 経済メディア（キーワードフィルタ）---
      {
        name: "Yahoo! 経済",
        url: "https://news.yahoo.co.jp/rss/categories/business.xml",
        keywords: LIFE_KEYWORDS,
      },
      {
        name: "東洋経済オンライン",
        url: "https://toyokeizai.net/list/feed/rss",
        keywords: LIFE_KEYWORDS,
      },
      {
        name: "ダイヤモンド・オンライン",
        url: "https://diamond.jp/list/feed/rss/dol",
        keywords: LIFE_KEYWORDS,
      },
      {
        name: "NHK 経済",
        url: "https://www.nhk.or.jp/rss/news/cat4.xml",
        keywords: LIFE_KEYWORDS,
      },
      {
        name: "日経ビジネス",
        url: "https://business.nikkei.com/rss/sns/nb.rdf",
        keywords: LIFE_KEYWORDS,
      },
      {
        name: "ITmedia ビジネス",
        url: "https://rss.itmedia.co.jp/rss/2.0/business.xml",
        keywords: LIFE_KEYWORDS,
      },
      {
        name: "プレジデントオンライン",
        url: "https://president.jp/list/rss",
        keywords: LIFE_KEYWORDS,
      },
      // --- 規制当局 ---
      {
        name: "金融庁",
        url: "https://www.fsa.go.jp/fsaNewsListAll_rss2.xml",
        keywords: ["保険", "生保", "生命保険"],
      },
    ],
  },
  {
    label: "損害保険",
    feeds: [
      // --- Google News ---
      {
        name: "Google News - 国内損保",
        url: googleNewsRSS(
          "損害保険 OR 損保 OR 東京海上 OR 損保ジャパン OR 三井住友海上 OR あいおいニッセイ OR SOMPO"
        ),
      },
      {
        name: "Google News - 再保険・海外損保",
        url: googleNewsRSS(
          "再保険 OR AIG保険 OR アリアンツ OR 自動車保険 OR 火災保険 OR 地震保険"
        ),
      },
      // --- 保険専門メディア ---
      {
        name: "保険毎日新聞",
        url: "https://homai.co.jp/news/feed/",
        keywords: NONLIFE_KEYWORDS,
      },
      {
        name: "新日本保険新聞",
        url: "https://www.shinnihon-ins.co.jp/industry-news/feed/",
        keywords: NONLIFE_KEYWORDS,
      },
      // --- 経済メディア ---
      {
        name: "Yahoo! 経済",
        url: "https://news.yahoo.co.jp/rss/categories/business.xml",
        keywords: NONLIFE_KEYWORDS,
      },
      {
        name: "東洋経済オンライン",
        url: "https://toyokeizai.net/list/feed/rss",
        keywords: NONLIFE_KEYWORDS,
      },
      {
        name: "ダイヤモンド・オンライン",
        url: "https://diamond.jp/list/feed/rss/dol",
        keywords: NONLIFE_KEYWORDS,
      },
      {
        name: "NHK 経済",
        url: "https://www.nhk.or.jp/rss/news/cat4.xml",
        keywords: NONLIFE_KEYWORDS,
      },
      {
        name: "日経ビジネス",
        url: "https://business.nikkei.com/rss/sns/nb.rdf",
        keywords: NONLIFE_KEYWORDS,
      },
      {
        name: "ITmedia ビジネス",
        url: "https://rss.itmedia.co.jp/rss/2.0/business.xml",
        keywords: NONLIFE_KEYWORDS,
      },
      // --- 規制当局 ---
      {
        name: "金融庁",
        url: "https://www.fsa.go.jp/fsaNewsListAll_rss2.xml",
        keywords: ["保険", "損保", "損害保険"],
      },
      // --- 海外保険専門メディア（英語）---
      {
        name: "Insurance Journal",
        url: "https://www.insurancejournal.com/rss/news/",
      },
      {
        name: "Artemis (再保険・ILS)",
        url: "https://www.artemis.bm/news/feed/",
      },
      {
        name: "Reinsurance News",
        url: "https://reinsurancene.ws/feed/",
      },
    ],
  },
];
