// ============================================
// メインエントリ（内部cronスケジューラ + ヘルスチェック）
// ============================================

import express from "express";
import cron from "node-cron";
import { config } from "./config";
import { fetchAllNews } from "./services/newsService";
import { fetchMarketData } from "./services/marketService";
import { sendLineMessage } from "./services/lineService";
import { formatNewsMessage } from "./formatter";

// --------------------------------------------------
// ニュース取得・送信ジョブ
// --------------------------------------------------
async function executeJob(): Promise<void> {
  const startTime = Date.now();
  console.log(`[INFO] ジョブ開始: ${new Date().toISOString()}`);

  try {
    const [allNews, marketData] = await Promise.all([
      fetchAllNews(),
      fetchMarketData(),
    ]);

    const message = formatNewsMessage(allNews, marketData);

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

// --------------------------------------------------
// Cronスケジュール登録
// --------------------------------------------------
const schedule = config.cronSchedule;

cron.schedule(schedule, executeJob, {
  timezone: "Asia/Tokyo",
});

// --------------------------------------------------
// HTTPサーバー（Railway/Render用ヘルスチェック）
// --------------------------------------------------
const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

app.get("/", (_req, res) => {
  res.json({
    status: "running",
    schedule,
    timezone: "Asia/Tokyo",
    uptime: `${Math.floor(process.uptime())}s`,
  });
});

app.get("/trigger", async (_req, res) => {
  res.json({ message: "ジョブを実行中..." });
  await executeJob();
});

app.listen(PORT, () => {
  console.log(`[INFO] LINE News Bot 起動`);
  console.log(`[INFO] Cronスケジュール: ${schedule} (Asia/Tokyo)`);
  console.log(`[INFO] ヘルスチェック: http://localhost:${PORT}/`);
  console.log(`[INFO] 手動実行: http://localhost:${PORT}/trigger`);
  console.log("[INFO] 次回実行を待機中...");
});
