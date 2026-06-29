// PWAアイコン生成スクリプト (Node.js 組み込みのみ使用)
import { createWriteStream } from 'fs';
import { deflateSync, crc32 } from 'zlib';
import { mkdir } from 'fs/promises';

// PNG チャンク生成
function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length);
  // CRC = crc32(type + data)
  const crcInput = Buffer.concat([typeBuf, data]);
  // zlib.crc32 は Node 22 以降。フォールバックで手計算
  const crcVal = nodeCrc32(crcInput);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal >>> 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

// CRC-32 テーブル
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function nodeCrc32(buf) {
  let crc = 0xFFFFFFFF;
  for (const b of buf) crc = crcTable[(crc ^ b) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF);
}

function createSolidPNG(size, { r, g, b }) {
  // PNG シグネチャ
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR: width, height, bitDepth=8, colorType=2(RGB), 3バイト0
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type: RGB
  ihdrData[10] = 0; ihdrData[11] = 0; ihdrData[12] = 0;

  // 生のピクセルデータ (各行: フィルタバイト0 + RGB × size)
  const rowSize = 1 + size * 3;
  const raw = Buffer.alloc(size * rowSize);
  for (let y = 0; y < size; y++) {
    raw[y * rowSize] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const off = y * rowSize + 1 + x * 3;
      raw[off]     = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
    }
  }

  const compressed = deflateSync(raw);
  const iendData = Buffer.alloc(0);

  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdrData),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', iendData),
  ]);
}

// #0d0d1a (ダークネイビー) に近い色
const bg = { r: 13, g: 13, b: 26 };

await mkdir('public/icons', { recursive: true });

const sizes = [192, 512];
for (const size of sizes) {
  const png = createSolidPNG(size, bg);
  const path = `public/icons/icon-${size}.png`;
  createWriteStream(path).end(png);
  console.log(`Created ${path} (${png.length} bytes)`);
}
console.log('Done.');
