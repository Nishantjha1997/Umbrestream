/**
 * Public-facing brand values. Keep compatibility-sensitive internal names
 * (analytics tables, local-storage keys, feature flags) unchanged until a
 * dedicated data migration is planned.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://streamfree.online").replace(/\/$/, "");

export const brand = {
  name: "StreamFree",
  shortName: "SF",
  domain: "streamfree.online",
  creatorName: "Nishant",
  description:
    "StreamFree is a movie, TV series, and anime discovery experience with regional recommendations, episode browsing, watch history, and dedicated Android and Android TV apps.",
} as const;
