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
  description:
    "Discover movies, TV series, and anime with episode browsing, subtitles, watch history, and a mobile-friendly viewing experience.",
} as const;
