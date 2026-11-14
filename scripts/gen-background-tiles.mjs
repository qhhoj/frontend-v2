/* eslint-disable id-length -- pixel and loop coordinates (x, y, i, j) */
// Regenerates the two page-background mask tiles in src/theme/backgrounds/ (`node scripts/gen-background-tiles.mjs`).
// 1-bit indexed PNGs: black where the pattern is, transparent elsewhere; CSS tints them (src/theme/backgrounds.css).
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/theme/backgrounds');

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (bytes) => {
  let c = 0xffffffff;
  for (const byte of bytes) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const frame = Buffer.alloc(8 + data.length + 4);
  frame.writeUInt32BE(data.length, 0);
  body.copy(frame, 4);
  frame.writeUInt32BE(crc32(body), 8 + data.length);
  return frame;
};

/** `isInk(x, y)` decides each pixel of a `size` x `size` tile. */
function png(size, isInk) {
  const stride = Math.ceil(size / 8) + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++)
      if (!isInk(x, y)) raw[y * stride + 1 + (x >> 3)] |= 0x80 >> (x & 7);
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.set([1, 3, 0, 0, 0], 8); // 1-bit, palette
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('PLTE', Buffer.from([0, 0, 0, 0, 0, 0])),
    chunk('tRNS', Buffer.from([255, 0])), // index 0 = ink (opaque), 1 = clear
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const rng = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const BAYER = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
];

/** Ordered dither of a diagonal wave: 4 px cells on a 256 px tile. */
const dither = png(256, (x, y) => {
  const [i, j] = [x >> 2, y >> 2];
  const level = 0.5 + 0.5 * Math.sin((2 * Math.PI * (i + j)) / 64);
  return level > BAYER[j % 8][i % 8] / 64;
});

/** Dots denser along a wave (same field as the first mock-up), wrapping at the edges; 1 px, or a plus for the bigger ones. */
function stippleTile(size, dots) {
  const random = rng(9);
  const ink = new Set();
  const put = (x, y) => ink.add(((y + size) % size) * size + ((x + size) % size));
  for (let k = 0; k < dots; k++) {
    const [x, y] = [Math.floor(random() * size), Math.floor(random() * size)];
    const density =
      0.5 +
      0.3 * Math.sin((2 * Math.PI * x) / size + 0.8) +
      0.2 * Math.sin(2 * Math.PI * (y / size + (x / size) * 2));
    if (random() >= density * density * 0.9) continue;
    put(x, y);
    if (random() > 0.7)
      [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].forEach(([dx, dy]) => put(x + dx, y + dy));
  }
  return png(size, (x, y) => ink.has(y * size + x));
}

mkdirSync(OUT, { recursive: true });
writeFileSync(resolve(OUT, 'dither.png'), dither);
writeFileSync(resolve(OUT, 'stipple.png'), stippleTile(240, 4800));
