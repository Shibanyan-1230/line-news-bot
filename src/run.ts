// ============================================
// ワンショット実行（外部cronトリガー用）
// ============================================

import { fetchAllNews } from "./services/newsService";
import { sendLineMessage } from "./services/lineService";
import { formatNewsMessage } from "./formatter";

async function main(): Promise<void> {
  const startTime = Date.now();
  console.log(`[INFO] 実行開始: ${new Date().toISOString()}`);

  try {
    // 1. ニュース取得
    const allNews = await fetchAllNews();

    // 2. メッセージ整形
    const message = formatNewsMessage(allNews);
    console.log("[INFO] 送信メッセージ:");
    console.log(message);
    console.log("---");

    // 3. LINE送信
    await sendLineMessage(message);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[INFO] 完了 (${elapsed}秒)`);
  } catch (error) {
    console.error("[ERROR] 実行失敗:");
    console.error(error);
    process.exit(1);
  }
}

main();
