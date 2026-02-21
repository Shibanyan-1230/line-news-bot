// ============================================
// メインエントリ（内部cronスケジューラ）
// ============================================

import cron from "node-cron";
import { config } from "./config";
import { fetchAllNews } from "./services/newsService";
import { sendLineMessage } from "./services/lineService";
import { formatNewsMessage } from "./formatter";

async function executeJob(): Promise<void> {
  const startTime = Date.now();
  console.log(`[INFO] ジョブ開始: ${new Date().toISOString()}`);

  try {
    const allNews = await fetchAllNews();
    const message = formatNewsMessage(allNews);

    console.log("[INFO] 送信メッセージ:");
    console.log(message);
    console.log("---");

    await sendLineMessage(message);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[INFO] ジョブ完了 (${elapsed}秒)`);
  } catch (error) {
    console.error("[ERROR] ジョブ失敗:");
    console.error(error);
  }
}

// Cronスケジュール登録
const schedule = config.cronSchedule;
console.log(`[INFO] LINE News Bot 起動`);
console.log(`[INFO] Cronスケジュール: ${schedule}`);
console.log(`[INFO] タイムゾーン: ${process.env.TZ || "system default"}`);

cron.schedule(schedule, executeJob, {
  timezone: "Asia/Tokyo",
});

console.log("[INFO] 次回実行を待機中...");

// 起動直後にも1回テスト実行したい場合は以下のコメントを外す
// executeJob();
