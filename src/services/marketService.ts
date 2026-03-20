// ============================================
// マーケット指標取得サービス
// ============================================

export interface MarketIndex {
  name: string;
  price: string;
  change: string;
  changePercent: string;
}

const INDICES = [
  { symbol: "^N225", name: "日経平均" },
  { symbol: "^TOPX", name: "TOPIX" },
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^IXIC", name: "NASDAQ" },
  { symbol: "^DJI", name: "NYダウ" },
  { symbol: "JPY=X", name: "USD/JPY" },
];

async function fetchYahooQuote(symbol: string): Promise<{ price: number; change: number; changePercent: number } | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`;
    const response = await fetch(url, {
      headers: { "User-Agent": "LINE-News-Bot/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return null;

    const data = await response.json() as any;
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const price = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose || meta.previousClose;

    if (price == null || prevClose == null) return null;

    const change = price - prevClose;
    const changePercent = (change / prevClose) * 100;

    return { price, change, changePercent };
  } catch {
    return null;
  }
}

export async function fetchMarketData(): Promise<MarketIndex[]> {
  console.log("[INFO] マーケット指標取得開始...");

  const results = await Promise.all(
    INDICES.map(async ({ symbol, name }) => {
      const quote = await fetchYahooQuote(symbol);
      if (!quote) {
        return { name, price: "---", change: "---", changePercent: "---" };
      }

      const isForex = symbol === "JPY=X";
      const priceStr = isForex
        ? quote.price.toFixed(2)
        : quote.price.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
      const sign = quote.change >= 0 ? "+" : "";
      const changeStr = isForex
        ? `${sign}${quote.change.toFixed(2)}`
        : `${sign}${quote.change.toLocaleString("ja-JP", { maximumFractionDigits: 2 })}`;
      const percentStr = `${sign}${quote.changePercent.toFixed(2)}%`;

      return { name, price: priceStr, change: changeStr, changePercent: percentStr };
    })
  );

  console.log(`[INFO] マーケット指標: ${results.filter(r => r.price !== "---").length}/${results.length}件取得`);
  return results;
}
