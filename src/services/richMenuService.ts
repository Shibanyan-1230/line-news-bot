// ============================================
// LINEリッチメニュー設定
// ============================================

import { config } from "../config";

const LINE_API = "https://api.line.me/v2/bot";

function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.line.channelAccessToken()}`,
  };
}

/**
 * リッチメニューを作成してデフォルトに設定する
 */
export async function setupRichMenu(): Promise<void> {
  const token = config.line.channelAccessToken();

  // 1. リッチメニュー作成
  const menuBody = {
    size: { width: 2500, height: 843 },
    selected: true,
    name: "News Bot Menu",
    chatBarText: "メニュー",
    areas: [
      {
        bounds: { x: 0, y: 0, width: 833, height: 843 },
        action: { type: "postback", data: "action=news", displayText: "最新ニュース" },
      },
      {
        bounds: { x: 833, y: 0, width: 834, height: 843 },
        action: { type: "postback", data: "action=save", displayText: "記事を保存" },
      },
      {
        bounds: { x: 1667, y: 0, width: 833, height: 843 },
        action: { type: "postback", data: "action=list", displayText: "保存リスト" },
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

  // 2. リッチメニュー画像をアップロード（シンプルなテキスト画像を生成）
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
 * シンプルなPNG画像を生成（2500x843、3分割メニュー）
 * 外部ライブラリなしでBMP風PNGを生成
 */
function createMenuImage(): Buffer {
  // シンプルなSVG → PNGの代わりに、最小限のPNGを生成
  // LINEのリッチメニュー画像は2500x843が推奨
  const width = 2500;
  const height = 843;

  // 最小限のBMPデータを作成（LINE APIはPNG/JPEGを要求）
  // ここではシンプルな単色画像を作成
  // 実際の運用ではCanvaやFigmaで作った画像を使うことを推奨

  // PNGヘッダー（1x1ピクセルの青い画像をスケーリングする代わりに）
  // シンプルに白い背景の最小PNG
  // 注: 実運用では適切なメニュー画像をアップロードすべき

  // 無圧縮のPNG: 2500x843は大きすぎるので、
  // まず小さい画像でテストし、後でちゃんとした画像に差し替える
  return createSimplePng(width, height);
}

/**
 * 最小限のPNGファイルを生成
 */
function createSimplePng(width: number, height: number): Buffer {
  // CRC32テーブル
  const crcTable: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }
  function crc32(buf: Buffer): number {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function chunk(type: string, data: Buffer): Buffer {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeAndData = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeAndData));
    return Buffer.concat([len, typeAndData, crc]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type (RGB)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT - 3色に分割した画像データ
  const rowSize = 1 + width * 3; // filter byte + RGB
  const rawData = Buffer.alloc(rowSize * height);

  const colors = [
    [52, 120, 198],  // 青 - ニュース
    [46, 170, 96],   // 緑 - 保存
    [230, 150, 30],  // オレンジ - リスト
  ];

  for (let y = 0; y < height; y++) {
    const offset = y * rowSize;
    rawData[offset] = 0; // no filter
    for (let x = 0; x < width; x++) {
      const section = x < 833 ? 0 : x < 1667 ? 1 : 2;
      // 区切り線
      const isBorder = x === 833 || x === 834 || x === 1667 || x === 1668;
      const px = offset + 1 + x * 3;
      if (isBorder) {
        rawData[px] = 255;
        rawData[px + 1] = 255;
        rawData[px + 2] = 255;
      } else {
        rawData[px] = colors[section][0];
        rawData[px + 1] = colors[section][1];
        rawData[px + 2] = colors[section][2];
      }
    }
  }

  // zlib圧縮（deflate）
  const zlib = require("zlib");
  const compressed = zlib.deflateSync(rawData);

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
