import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import {
  ACTIVE_APK_MANIFESTS,
  createOfficialApkHeaderRules,
} from "../src/lib/releases/downloadHeaders.ts";

const root = process.cwd();
const manifestFiles = ACTIVE_APK_MANIFESTS;
const rules = createOfficialApkHeaderRules();
const configSource = await readFile(resolve(root, "next.config.ts"), "utf8");

assert.match(
  configSource,
  /createOfficialApkHeaderRules\(\)/,
  "[download-headers] next.config.ts must use the manifest-derived rules",
);

function headerValue(rule, name) {
  return rule.headers?.find((header) => header.key.toLowerCase() === name.toLowerCase())?.value;
}

for (const manifestFile of manifestFiles) {
  const manifest = JSON.parse(
    await readFile(resolve(root, "public", "downloads", manifestFile), "utf8"),
  );
  const url = new URL(manifest.apkUrl, "https://streamfree.online");
  const filename = basename(url.pathname);
  const rule = rules.find((candidate) => candidate.source === url.pathname);

  assert(rule, `[download-headers] ${manifestFile} has no exact Vercel header rule`);
  assert.equal(
    headerValue(rule, "Content-Type"),
    "application/vnd.android.package-archive",
    `[download-headers] ${filename} has an invalid Content-Type`,
  );
  assert.equal(
    headerValue(rule, "Content-Disposition"),
    `attachment; filename="${filename}"`,
    `[download-headers] ${filename} has an invalid Content-Disposition`,
  );
  assert.equal(
    headerValue(rule, "X-Content-Type-Options"),
    "nosniff",
    `[download-headers] ${filename} is missing nosniff`,
  );
}

console.log(`[download-headers] verified ${manifestFiles.length} active APK response rules`);
