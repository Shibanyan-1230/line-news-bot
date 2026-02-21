// ============================================
// メッセージフォーマッター
// ============================================

import { CategoryNews } from "./services/newsService";

const TITLE_MAX_LENGTH = 30;

/**
 * 見出しを短縮する
 * - Google Newsの「タイトル - メディア名」からメディア名を除去
 * - 20文字以内に切り詰め、超過分は「…」
 */
function shortenTitle(title: string): string {
  // 末尾の「 - メディア名」を除去
  const cleaned = title.replace(/\s*[-–—|]\s*[^\-–—|]+$/, "").trim();
  if (cleaned.length <= TITLE_MAX_LENGTH) return cleaned;
  return cleaned.slice(0, TITLE_MAX_LENGTH) + "…";
}

/**
 * ニュースデータをLINE送信用テキストに整形
 *
 * 出力例:
 * 【保険ニュース】2026/02/22
 *
 * ■生命保険
 * ・日本生命が新商品を発表…
 *   https://example.com/1
 *
 * ■損害保険
 * ・東京海上HD、海外事業を…
 *   https://example.com/2
 */
export function formatNewsMessage(allNews: CategoryNews[]): string {
  const today = new Date().toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const lines: string[] = [`【保険ニュース】${today}`];

  for (const category of allNews) {
    lines.push("");
    lines.push(`■${category.label}`);

    if (category.items.length === 0) {
      lines.push("・本日の該当ニュースはありません");
      continue;
    }

    for (const item of category.items) {
      lines.push(`・${shortenTitle(item.title)}`);
      lines.push(`  ${item.url}`);
    }
  }

  return lines.join("\n");
}
