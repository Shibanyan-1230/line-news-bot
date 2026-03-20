// ============================================
// RSSフィード定義（保険・IT/AI・マーケット）
// Google Newsは元記事URLを取得できないため
// 直接URLを返すRSSソースを優先的に使用
// ============================================

export interface FeedSource {
  name: string;
  url: string;
  keywords?: string[];
}

export interface CategoryFeeds {
  label: string;
  feeds: FeedSource[];
}

// --------------------------------------------------
// キーワードフィルタ
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
  "あいおいニッセイ", "SOMPO", "ソンポ",
  "自動車保険", "火災保険", "地震保険", "傷害保険",
  "サイバー保険", "賠償責任保険",
  "MS&AD", "SOMPOホールディングス", "東京海上HD",
];

export const IT_AI_KEYWORDS = [
  "AI", "人工知能", "生成AI", "ChatGPT", "Claude", "LLM",
  "機械学習", "ディープラーニング", "OpenAI", "Google AI", "Anthropic",
  "SaaS", "クラウド", "AWS", "Azure", "DX", "デジタル変革",
  "システム開発", "エンジニア", "プログラミング",
  "サイバーセキュリティ", "データセンター",
  "半導体", "NVIDIA", "GPU",
];

export const MARKET_KEYWORDS = [
  "株価", "日経平均", "TOPIX", "S&P", "ナスダック", "NASDAQ",
  "ダウ", "為替", "ドル円", "円安", "円高",
  "利上げ", "利下げ", "金利", "FRB", "日銀", "金融政策",
  "決算", "業績", "上方修正", "下方修正",
  "IPO", "上場", "M&A", "TOB", "自社株買い",
  "原油", "金価格", "ビットコイン",
];

// --------------------------------------------------
// カテゴリ定義（直接URL返却ソースを優先）
// --------------------------------------------------
export const categories: CategoryFeeds[] = [
  {
    label: "生命保険",
    feeds: [
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
        name: "ダイヤモンド・オンライン",
        url: "https://diamond.jp/list/feed/rss/dol",
        keywords: LIFE_KEYWORDS,
      },
      {
        name: "プレジデントオンライン",
        url: "https://president.jp/list/rss",
        keywords: LIFE_KEYWORDS,
      },
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
      {
        name: "金融庁",
        url: "https://www.fsa.go.jp/fsaNewsListAll_rss2.xml",
        keywords: ["保険", "損保", "損害保険"],
      },
      {
        name: "ダイヤモンド・オンライン",
        url: "https://diamond.jp/list/feed/rss/dol",
        keywords: NONLIFE_KEYWORDS,
      },
      {
        name: "プレジデントオンライン",
        url: "https://president.jp/list/rss",
        keywords: NONLIFE_KEYWORDS,
      },
    ],
  },
  {
    label: "IT・AI・システム開発",
    feeds: [
      {
        name: "ITmedia AI+",
        url: "https://rss.itmedia.co.jp/rss/2.0/aiplus.xml",
      },
      {
        name: "ITmedia エンタープライズ",
        url: "https://rss.itmedia.co.jp/rss/2.0/enterprise.xml",
        keywords: IT_AI_KEYWORDS,
      },
      {
        name: "CNET Japan",
        url: "https://japan.cnet.com/rss/index.rdf",
        keywords: IT_AI_KEYWORDS,
      },
      {
        name: "Yahoo! IT",
        url: "https://news.yahoo.co.jp/rss/categories/it.xml",
        keywords: IT_AI_KEYWORDS,
      },
      {
        name: "Publickey",
        url: "https://www.publickey1.jp/atom.xml",
        keywords: IT_AI_KEYWORDS,
      },
      {
        name: "TechCrunch (英語)",
        url: "https://techcrunch.com/feed/",
        keywords: ["AI", "OpenAI", "Anthropic", "Claude", "LLM", "GPU", "NVIDIA", "cloud", "cybersecurity"],
      },
      {
        name: "The Verge AI",
        url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
      },
    ],
  },
  {
    label: "マーケット・株式",
    feeds: [
      {
        name: "Yahoo! 経済",
        url: "https://news.yahoo.co.jp/rss/categories/business.xml",
        keywords: MARKET_KEYWORDS,
      },
      {
        name: "NHK 経済",
        url: "https://www.nhk.or.jp/rss/news/cat4.xml",
        keywords: MARKET_KEYWORDS,
      },
      {
        name: "東洋経済オンライン",
        url: "https://toyokeizai.net/list/feed/rss",
        keywords: MARKET_KEYWORDS,
      },
      {
        name: "日経ビジネス",
        url: "https://business.nikkei.com/rss/sns/nb.rdf",
        keywords: MARKET_KEYWORDS,
      },
      {
        name: "ダイヤモンド・オンライン",
        url: "https://diamond.jp/list/feed/rss/dol",
        keywords: MARKET_KEYWORDS,
      },
      {
        name: "Bloomberg (英語)",
        url: "https://feeds.bloomberg.com/markets/news.rss",
      },
      {
        name: "CNBC Markets",
        url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=20910258",
      },
    ],
  },
];
