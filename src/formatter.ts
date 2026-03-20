// ============================================
// メッセージフォーマッター
// ============================================

import { CategoryNews } from "./services/newsService";
import { MarketIndex } from "./services/marketService";

const TITLE_MAX_LENGTH = 40;

function shortenTitle(title: string): string {
  const cleaned = title.replace(/\s*[-–—|]\s*[^\-–—|]+$/, "").trim();
  if (cleaned.length <= TITLE_MAX_LENGTH) return cleaned;
  return cleaned.slice(0, TITLE_MAX_LENGTH) + "…";
}

export function formatNewsMessage(
  allNews: CategoryNews[],
  marketData: MarketIndex[]
): string {
  const today = new Date().toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const lines: string[] = [];

  // ヘッダー
  lines.push(`━━━━━━━━━━━━━━━`);
  lines.push(`  Daily News Brief  ${today}`);
  lines.push(`━━━━━━━━━━━━━━━`);

  // マーケット指標
  const validMarket = marketData.filter((m) => m.price !== "---");
  if (validMarket.length > 0) {
    lines.push("");
    lines.push(`▼ Market`);
    for (const m of validMarket) {
      lines.push(`  ${m.name}  ${m.price} (${m.changePercent})`);
    }
  }

  // ニュースカテゴリ
  for (const category of allNews) {
    lines.push("");
    lines.push(`■ ${category.label}`);

    if (category.items.length === 0) {
      lines.push("  本日の該当ニュースなし");
      continue;
    }

    for (const item of category.items) {
      lines.push(`・${shortenTitle(item.title)}`);
      lines.push(`  ${item.url}`);
    }
  }

  return lines.join("\n");
}
