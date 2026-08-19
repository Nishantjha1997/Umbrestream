import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";

const root = process.cwd();
const downloads = resolve(root, "public", "downloads");
const manifests = ["streamfree-android.json", "streamfree-android-tv.json"];
const forbidden = /(?:debug|unsigned|development|dev[-_])/i;

const fail = (message) => {
  throw new Error(`[release-artifacts] ${message}`);
};

const allFiles = await readdir(downloads);
for (const filename of allFiles) {
  if (filename.toLowerCase().endsWith(".apk") && forbidden.test(filename)) {
    fail(`development APK is present in public downloads: ${filename}`);
  }
}

for (const manifestName of manifests) {
  const manifestPath = resolve(downloads, manifestName);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const apkPathname = new URL(manifest.apkUrl, "https://streamfree.online").pathname;
  const apkName = basename(apkPathname);
  const apkPath = resolve(downloads, apkName);

  if (dirname(apkPath) !== downloads || !apkName.toLowerCase().endsWith(".apk")) {
    fail(`${manifestName} points outside public/downloads: ${manifest.apkUrl}`);
  }
  if (forbidden.test(apkName)) fail(`${manifestName} points to a development APK: ${apkName}`);

  const bytes = await readFile(apkPath);
  const sha256 = createHash("sha256").update(bytes).digest("hex").toUpperCase();
  if (bytes.length !== Number(manifest.sizeBytes)) {
    fail(`${manifestName} size does not match ${apkName}`);
  }
  if (sha256 !== String(manifest.sha256).toUpperCase()) {
    fail(`${manifestName} SHA-256 does not match ${apkName}`);
  }
}

console.log(`[release-artifacts] verified ${manifests.length} manifests and no development APKs`);
