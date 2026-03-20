// ============================================
// 環境変数・設定管理
// ============================================

import 'dotenv/config';

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`環境変数 ${key} が設定されていません`);
  }
  return value;
}

export const config = {
  line: {
    channelAccessToken: () => requireEnv("LINE_CHANNEL_ACCESS_TOKEN"),
    userId: () => requireEnv("LINE_USER_ID"),
  },
  cronSchedule: process.env.CRON_SCHEDULE || "0 7 * * *",
};
