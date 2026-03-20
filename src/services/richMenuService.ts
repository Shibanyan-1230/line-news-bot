// ============================================
// LINEリッチメニュー設定
// ============================================

import { createCanvas } from "canvas";
import { config } from "../config";

const LINE_API = "https://api.line.me/v2/bot";

function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.line.channelAccessToken()}`,
  };
}

/**
 * 既存のリッチメニューを全削除
 */
async function deleteAllRichMenus(): Promise<void> {
  const res = await fetch(`${LINE_API}/richmenu/list`, {
    headers: headers(),
  });
  const data = (await res.json()) as any;
  for (const menu of data.richmenus || []) {
    await fetch(`${LINE_API}/richmenu/${menu.richMenuId}`, {
      method: "DELETE",
      headers: headers(),
    });
    console.log(`[INFO] 旧メニュー削除: ${menu.richMenuId}`);
  }
}

/**
 * リッチメニューを作成してデフォルトに設定する
 */
export async function setupRichMenu(): Promise<void> {
  const token = config.line.channelAccessToken();
  const notionDbId = config.notion.databaseId();
  const notionUrl = `https://www.notion.so/${notionDbId}`;

  // 旧メニュー削除
  await deleteAllRichMenus();

  // 1. リッチメニュー作成
  const menuBody = {
    size: { width: 2500, height: 843 },
    selected: true,
    name: "News Bot Menu",
    chatBarText: "メニューを開く",
    areas: [
      {
        bounds: { x: 0, y: 0, width: 833, height: 843 },
        action: {
          type: "postback",
          data: "action=news",
          displayText: "最新ニュース",
        },
      },
      {
        bounds: { x: 833, y: 0, width: 834, height: 843 },
        action: {
          type: "postback",
          data: "action=save",
          displayText: "記事を保存",
        },
      },
      {
        bounds: { x: 1667, y: 0, width: 833, height: 843 },
        action: {
          type: "uri",
          uri: notionUrl,
          label: "保存リスト",
        },
      },
    ],
  };

  const createRes = await fetch(`${LINE_API}/richmenu`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(menuBody),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    console.error("[ERROR] リッチメニュー作成失敗:", err);
    return;
  }

  const { richMenuId } = (await createRes.json()) as { richMenuId: string };
  console.log(`[INFO] リッチメニュー作成: ${richMenuId}`);

  // 2. メニュー画像生成＆アップロード
  const imageBuffer = createMenuImage();

  const uploadRes = await fetch(
    `https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`,
    {
      method: "POST",
      headers: {
        "Content-Type": "image/png",
        Authorization: `Bearer ${token}`,
      },
      body: imageBuffer,
    }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    console.error("[ERROR] メニュー画像アップロード失敗:", err);
    return;
  }
  console.log("[INFO] メニュー画像アップロード完了");

  // 3. デフォルトリッチメニューに設定
  const defaultRes = await fetch(
    `${LINE_API}/user/all/richmenu/${richMenuId}`,
    {
      method: "POST",
      headers: headers(),
    }
  );

  if (!defaultRes.ok) {
    const err = await defaultRes.text();
    console.error("[ERROR] デフォルトメニュー設定失敗:", err);
    return;
  }

  console.log("[INFO] リッチメニュー設定完了!");
}

/**
 * ポップなメニュー画像を生成（2500x843）
 */
function createMenuImage(): Buffer {
  const width = 2500;
  const height = 843;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const sections = [
    { bg: "#4A90D9", icon: "📰", label: "最新ニュース", sub: "Latest News" },
    { bg: "#2ECC71", icon: "📌", label: "記事を保存", sub: "Save Article" },
    { bg: "#F39C12", icon: "📋", label: "保存リスト", sub: "Open Notion" },
  ];

  const sectionWidth = Math.floor(width / 3);

  for (let i = 0; i < 3; i++) {
    const x = i * sectionWidth;
    const s = sections[i];

    // 背景グラデーション風（上部を明るく）
    const gradient = ctx.createLinearGradient(x, 0, x, height);
    gradient.addColorStop(0, lightenColor(s.bg, 20));
    gradient.addColorStop(1, s.bg);
    ctx.fillStyle = gradient;
    ctx.fillRect(x, 0, sectionWidth, height);

    // 区切り線（白、半透明）
    if (i > 0) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.fillRect(x - 2, 40, 4, height - 80);
    }

    const centerX = x + sectionWidth / 2;

    // アイコン（大きな丸背景 + テキスト）
    ctx.beginPath();
    ctx.arc(centerX, 300, 120, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.fill();

    // アイコンテキスト
    ctx.font = "120px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(s.icon, centerX, 300);

    // メインラベル
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 72px sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText(s.label, centerX, 530);

    // サブラベル
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "40px sans-serif";
    ctx.fillText(s.sub, centerX, 620);

    // 下部アクセント（白い線）
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    const barWidth = 100;
    ctx.beginPath();
    ctx.roundRect(centerX - barWidth / 2, 700, barWidth, 6, 3);
    ctx.fill();
  }

  return canvas.toBuffer("image/png");
}

/**
 * HEXカラーを明るくする
 */
function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + percent);
  const g = Math.min(255, ((num >> 8) & 0xff) + percent);
  const b = Math.min(255, (num & 0xff) + percent);
  return `rgb(${r}, ${g}, ${b})`;
}
