// ============================================
// メッセージフォーマッター
// ============================================

import { CategoryNews } from "./services/newsService";

/**
 * ニュースデータをLINE送信用テキストに整形
 *
 * 出力例:
 * 【本日の業界ニュース】2026/02/18
 *
 * ■金融
 * ・記事タイトル
 *   https://example.com/article1
 *
 * ■自動車
 * ・記事タイトル
 *   https://example.com/article2
 */
export function formatNewsMessage(allNews: CategoryNews[]): string {
  const today = new Date().toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const lines: string[] = [`【本日の業界ニュース】${today}`];

  for (const category of allNews) {
    lines.push("");
    lines.push(`■${category.label}`);

    if (category.items.length === 0) {
      lines.push("・本日の該当ニュースはありません");
      continue;
    }

    for (const item of category.items) {
      // Google Newsの「タイトル - メディア名」はそのまま表示
      // （出典がわかって便利）
      lines.push(`・${item.title}`);
      lines.push(`  ${item.url}`);
    }
  }

  return lines.join("\n");
}
