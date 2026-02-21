// ============================================
// RSSフィード定義（保険業界特化）
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
    label: "生命保険",
    feeds: [
      {
        name: "Google News - 国内生保",
        url: googleNewsRSS(
          "生命保険 OR 日本生命 OR 第一生命 OR 明治安田生命 OR 住友生命"
        ),
      },
      {
        name: "Google News - 海外生保",
        url: googleNewsRSS(
          "海外 生命保険 OR メットライフ OR プルデンシャル OR アフラック OR 生保 海外展開"
        ),
      },
    ],
  },
  {
    label: "損害保険",
    feeds: [
      {
        name: "Google News - 国内損保",
        url: googleNewsRSS(
          "損害保険 OR 東京海上 OR 損保ジャパン OR 三井住友海上 OR あいおいニッセイ"
        ),
      },
      {
        name: "Google News - 海外損保・再保険",
        url: googleNewsRSS(
          "海外 損害保険 OR 再保険 OR ロイズ OR AIG OR アリアンツ OR 損保 海外"
        ),
      },
    ],
  },
];
