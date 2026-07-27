import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(`${ROOT}/public/favicon.svg`);

async function png(size) {
  return sharp(svg, { density: 384 }).resize(size, size).png().toBuffer();
}

const sizes = [16, 32, 48];
const frames = await Promise.all(sizes.map(png));

// Minimal ICO container embedding PNG-compressed frames — supported since
// Vista and universally understood by modern browsers.
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(sizes.length, 4);

let offset = 6 + sizes.length * 16;
const entryBufs = sizes.map((size, i) => {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size, 0);
  entry.writeUInt8(size, 1);
  entry.writeUInt8(0, 2); // color palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // planes
  entry.writeUInt16LE(32, 6); // bit depth
  entry.writeUInt32LE(frames[i].length, 8);
  entry.writeUInt32LE(offset, 12);
  offset += frames[i].length;
  return entry;
});

const ico = Buffer.concat([header, ...entryBufs, ...frames]);
writeFileSync(`${ROOT}/public/favicon.ico`, ico);
console.log(`favicon.ico written: ${ico.length} bytes`);

// Overwrite the actually-referenced manifest/apple-touch icon sizes.
const targets = [
  ["public/icons/android/android-launchericon-192-192.png", 192],
  ["public/icons/android/android-launchericon-512-512.png", 512],
  ["public/icons/android/android-launchericon-144-144.png", 144],
  ["public/icons/android/android-launchericon-96-96.png", 96],
  ["public/icons/android/android-launchericon-72-72.png", 72],
  ["public/icons/android/android-launchericon-48-48.png", 48],
  ["public/icons/ios/180.png", 180],
  ["public/icons/ios/1024.png", 1024],
  ["public/icons/ios/512.png", 512],
  ["public/icons/ios/192.png", 192],
  ["public/icons/ios/152.png", 152],
  ["public/icons/ios/167.png", 167],
  ["public/icons/ios/120.png", 120],
];

for (const [relPath, size] of targets) {
  const buf = await png(size);
  writeFileSync(`${ROOT}/${relPath}`, buf);
  console.log(`${relPath} (${size}x${size}) written: ${buf.length} bytes`);
}
