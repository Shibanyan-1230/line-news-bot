// ============================================
// LINE Messaging API サービス（Push送信）
// ============================================

import { config } from "../config";

const LINE_API_URL = "https://api.line.me/v2/bot/message/push";
const MAX_MESSAGE_LENGTH = 5000;

/**
 * LINEにテキストメッセージをPush送信する
 * 5000文字を超える場合は分割送信
 */
export async function sendLineMessage(text: string): Promise<void> {
  const token = config.line.channelAccessToken();
  const userId = config.line.userId();

  // 5000文字を超える場合は分割
  const chunks = splitMessage(text, MAX_MESSAGE_LENGTH);

  for (const chunk of chunks) {
    const response = await fetch(LINE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: [
          {
            type: "text",
            text: chunk,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `LINE API エラー (${response.status}): ${errorBody}`
      );
    }
  }

  console.log(`[INFO] LINE送信完了 (${chunks.length}通)`);
}

/**
 * メッセージを指定文字数以内に分割する
 * セクション（■で始まるブロック）単位で分割を試みる
 */
function splitMessage(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) return [text];

  const chunks: string[] = [];
  const sections = text.split(/(?=■)/);
  let current = "";

  for (const section of sections) {
    if (current.length + section.length > maxLength) {
      if (current) chunks.push(current.trim());
      current = section;
    } else {
      current += section;
    }
  }
  if (current) chunks.push(current.trim());

  return chunks;
}
