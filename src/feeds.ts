// ============================================
// RSSフィード定義
// ============================================

export interface FeedSource {
  name: string;
  url: string;
}

export interface CategoryFeeds {
  label: string;
  feeds: FeedSource[];
}

// Google News RSSは無料で日本語ニュース検索が可能
// when:1d で直近24時間に限定
function googleNewsRSS(query: string): string {
  const encoded = encodeURIComponent(query + " when:1d");
  return `https://news.google.com/rss/search?q=${encoded}&hl=ja&gl=JP&ceid=JP:ja`;
}

export const categories: CategoryFeeds[] = [
  {
    label: "金融",
    feeds: [
      {
        name: "Google News - 銀行・証券",
        url: googleNewsRSS("銀行 OR 証券 OR 金融"),
      },
      {
        name: "Google News - 生命保険・損害保険",
        url: googleNewsRSS("生命保険 OR 損害保険 OR 保険会社"),
      },
      {
        name: "NHK - ビジネス",
        url: "https://www.nhk.or.jp/rss/news/cat5.xml",
      },
    ],
  },
  {
    label: "自動車",
    feeds: [
      {
        name: "Google News - 自動車メーカー",
        url: googleNewsRSS("自動車メーカー OR トヨタ OR ホンダ OR 日産 OR EV"),
      },
      {
        name: "Google News - 自動車販売・整備",
        url: googleNewsRSS("自動車ディーラー OR カーディーラー OR 自動車整備"),
      },
      {
        name: "Response.jp",
        url: "https://response.jp/rss/index.rdf",
      },
    ],
  },
];
