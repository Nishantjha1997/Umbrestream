import type { AudioVariant } from "./types";

/**
 * Provider names that StreamFree can surface when an authorized Anivexa or
 * MiruroAPI deployment returns a compatible stream. Keeping this catalog
 * separate from live candidates lets the picker be honest: a provider is
 * never made clickable until it has returned a validated URL for this title
 * and episode.
 */
export interface AnimeProviderCatalogEntry {
  id: string;
  label: string;
  variants: AudioVariant[];
}

export const ANIME_PROVIDER_CATALOG: AnimeProviderCatalogEntry[] = [
  { id: "miruro", label: "Miruro", variants: ["sub", "dub"] },
  { id: "anikoto", label: "AniKoto", variants: ["sub", "dub"] },
  { id: "reanime", label: "ReAnime", variants: ["sub", "dub"] },
  { id: "anizone", label: "AniZone", variants: ["sub"] },
  { id: "animecg", label: "AnimeCG", variants: ["sub", "dub"] },
  { id: "animegg", label: "AnimeGG", variants: ["sub", "dub"] },
  { id: "anineko", label: "AniNeko", variants: ["sub", "dub"] },
  { id: "2dhive", label: "2DHive", variants: ["sub", "dub"] },
  { id: "megaplay", label: "MegaPlay", variants: ["sub", "dub"] },
];

