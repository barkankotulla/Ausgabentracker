// Erzeugt die App-Icons (PNG + SVG): node tools/gen-icons.mjs
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '..');
const BG = [0x1c, 0x19, 0x17];
// Zwei Balken: Einnahme (grün, hoch) und Ausgabe (rot, niedriger) – Koordinaten relativ zu 1
const BARS = [
  { x: 0.33, y: 0.30, w: 0.15, h: 0.40, c: [0x22, 0xc5, 0x5e] },
  { x: 0.52, y: 0.44, w: 0.15, h: 0.26, c: [0xef, 0x44, 0x44] },
];
const R = 0.05;

function inRounded(px, py, b) {
  if (px < b.x || px > b.x + b.w || py < b.y || py > b.y + b.h) return false;
  const cx = Math.min(Math.max(px, b.x + R), b.x + b.w - R);
  const cy = Math.min(Math.max(py, b.y + R), b.y + b.h - R);
  return (px - cx) ** 2 + (py - cy) ** 2 <= R * R;
}

function png(size) {
  const S = 4; // Supersampling für glatte Kanten
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const acc = [0, 0, 0];
      for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) {
        const px = (x + (sx + 0.5) / S) / size, py = (y + (sy + 0.5) / S) / size;
        const bar = BARS.find(b => inRounded(px, py, b));
        const c = bar ? bar.c : BG;
        for (let i = 0; i < 3; i++) acc[i] += c[i];
      }
      for (let i = 0; i < 3; i++) raw[y * (size * 3 + 1) + 1 + x * 3 + i] = Math.round(acc[i] / (S * S));
    }
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8 Bit, RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
function crc32(buf) { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }

for (const s of [192, 512]) writeFileSync(join(out, `icon-${s}.png`), png(s));
writeFileSync(join(out, 'apple-touch-icon.png'), png(180));

const hex = c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="${hex(BG)}"/>${BARS.map(b => `<rect x="${b.x * 100}" y="${b.y * 100}" width="${b.w * 100}" height="${b.h * 100}" rx="${R * 100}" fill="${hex(b.c)}"/>`).join('')}</svg>\n`;
writeFileSync(join(out, 'icon.svg'), svg);
console.log('Icons erzeugt');
