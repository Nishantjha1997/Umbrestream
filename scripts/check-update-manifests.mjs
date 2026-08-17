import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

const root = process.cwd();
const downloads = resolve(root, "public", "downloads");
const expected = [
  {
    file: "streamfree-android.json",
    platform: "android",
    packageId: "online.streamfree.app",
  },
  {
    file: "streamfree-android-tv.json",
    platform: "android-tv",
    packageId: "online.streamfree.tv",
  },
];

const fail = (message) => {
  throw new Error(`[update-manifest] ${message}`);
};

function officialDownloadPath(value, field) {
  const url = new URL(value, "https://streamfree.online");
  if (
    url.protocol !== "https:" ||
    url.hostname !== "streamfree.online" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !url.pathname.startsWith("/downloads/") ||
    !url.pathname.toLowerCase().endsWith(".apk")
  ) {
    fail(`${field} is not an official HTTPS download path: ${value}`);
  }
  return basename(url.pathname);
}

async function verifyFile(manifest, path, fieldPrefix) {
  const bytes = await readFile(resolve(downloads, path));
  const digest = createHash("sha256").update(bytes).digest("hex").toUpperCase();
  if (bytes.length !== Number(manifest.sizeBytes)) fail(`${fieldPrefix} size does not match ${path}`);
  if (digest !== String(manifest.sha256).toUpperCase()) fail(`${fieldPrefix} SHA-256 does not match ${path}`);
}

for (const item of expected) {
  const manifest = JSON.parse(await readFile(resolve(downloads, item.file), "utf8"));
  const required = [
    "schemaVersion",
    "packageId",
    "versionName",
    "versionCode",
    "apkUrl",
    "sha256",
    "sizeBytes",
    "signingCertificateSha256",
    "publishedAt",
    "minimumSupportedVersion",
    "mandatory",
    "releaseNotes",
  ];
  for (const field of required) if (!(field in manifest)) fail(`${item.file} is missing ${field}`);
  if (manifest.schemaVersion !== 1 || manifest.platform !== item.platform) fail(`${item.file} schema/platform mismatch`);
  if (manifest.packageId !== item.packageId) fail(`${item.file} packageId mismatch`);
  if (!Number.isSafeInteger(manifest.versionCode) || manifest.versionCode < 1) fail(`${item.file} has invalid versionCode`);
  if (!Number.isSafeInteger(manifest.minimumSupportedVersion) || manifest.minimumSupportedVersion < 1) fail(`${item.file} has invalid minimumSupportedVersion`);
  if (!/^[A-F0-9]{64}$/i.test(manifest.sha256)) fail(`${item.file} has invalid sha256`);
  if (!/^[A-F0-9]{64}$/i.test(manifest.signingCertificateSha256)) fail(`${item.file} has invalid certificate fingerprint`);
  if (!Number.isSafeInteger(manifest.sizeBytes) || manifest.sizeBytes < 1) fail(`${item.file} has invalid sizeBytes`);
  if (!Array.isArray(manifest.releaseNotes)) fail(`${item.file} releaseNotes must be an array`);
  const apkName = officialDownloadPath(manifest.apkUrl, `${item.file}.apkUrl`);
  await verifyFile(manifest, apkName, item.file);

  if (manifest.migrationHelperUrl) {
    const helperName = officialDownloadPath(manifest.migrationHelperUrl, `${item.file}.migrationHelperUrl`);
    if (!/^[A-F0-9]{64}$/i.test(manifest.migrationHelperSha256) || !Number.isSafeInteger(manifest.migrationHelperSizeBytes)) {
      fail(`${item.file} migration helper metadata is incomplete`);
    }
    await verifyFile(
      { sha256: manifest.migrationHelperSha256, sizeBytes: manifest.migrationHelperSizeBytes },
      helperName,
      `${item.file} migration helper`,
    );
  }
}

console.log(`[update-manifest] verified ${expected.length} official manifests, APKs, and migration metadata`);
