import { readFileSync } from "node:fs";
import { basename, join } from "node:path";

type ApkReleaseManifest = {
  apkUrl: string;
};

const OFFICIAL_ORIGIN = "https://streamfree.online";
export const ACTIVE_APK_MANIFESTS = [
  "streamfree-android.json",
  "streamfree-android-tv.json",
] as const;

export type DownloadHeaderRule = {
  source: string;
  headers: Array<{ key: string; value: string }>;
};

/**
 * Reads only release-manifest paths that the native updater can verify. This
 * keeps Vercel's APK response rules coupled to the signed release metadata,
 * rather than relying on a hand-maintained filename list.
 */
export function readOfficialApkDownloads(
  root = process.cwd(),
): Array<{ source: string; filename: string }> {
  return ACTIVE_APK_MANIFESTS.map((manifestName) => {
    const manifestPath = join(root, "public", "downloads", manifestName);
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as ApkReleaseManifest;
    const url = new URL(manifest.apkUrl, OFFICIAL_ORIGIN);
    const filename = basename(url.pathname);

    if (
      url.origin !== OFFICIAL_ORIGIN ||
      url.search ||
      url.hash ||
      !url.pathname.startsWith("/downloads/") ||
      !filename.toLowerCase().endsWith(".apk") ||
      !/^[A-Za-z0-9][A-Za-z0-9._-]*\.apk$/i.test(filename)
    ) {
      throw new Error(`Invalid official APK URL in ${manifestName}: ${manifest.apkUrl}`);
    }

    return { source: url.pathname, filename };
  });
}

export function createOfficialApkHeaderRules(
  downloads = readOfficialApkDownloads(),
): DownloadHeaderRule[] {
  return downloads.map(({ source, filename }) => ({
    source,
    headers: [
      { key: "Content-Type", value: "application/vnd.android.package-archive" },
      { key: "Content-Disposition", value: `attachment; filename="${filename}"` },
      { key: "X-Content-Type-Options", value: "nosniff" },
    ],
  }));
}
