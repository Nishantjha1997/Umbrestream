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
  // Anivexa API providers (requires ANIVEXA_API_BASE_URL env var)
  { id: "anivexa:anibd", label: "Anivexa · AniBD", variants: ["sub", "dub"] },
  { id: "anivexa:reanime", label: "Anivexa · ReAnime", variants: ["sub", "dub"] },
  { id: "anivexa:anikoto", label: "Anivexa · AniKoto", variants: ["sub", "dub"] },
  { id: "anivexa:animegg", label: "Anivexa · AnimeGG", variants: ["sub", "dub"] },
  { id: "anivexa:anineko", label: "Anivexa · AniNeko", variants: ["sub", "dub"] },
  { id: "anivexa:anizone", label: "Anivexa · AniZone", variants: ["sub"] },
  { id: "anivexa:2dhive", label: "Anivexa · 2DHive", variants: ["sub", "dub"] },
  { id: "anivexa:mkissa", label: "Anivexa · MKissa", variants: ["sub", "dub"] },
  { id: "anivexa:senshi", label: "Anivexa · Senshi", variants: ["sub", "dub"] },
  { id: "anivexa:kickassanime", label: "Anivexa · KickAssAnime", variants: ["sub", "dub"] },
  { id: "anivexa:anidbapp", label: "Anivexa · AniDB", variants: ["sub", "dub"] },
  { id: "anivexa:animenosub", label: "Anivexa · AnimeNoSub", variants: ["sub", "dub"] },
  { id: "anivexa:animedunya", label: "Anivexa · AnimeDunya", variants: ["sub", "dub"] },
  { id: "anivexa:animecg", label: "Anivexa · AnimeCG", variants: ["sub", "dub"] },
  { id: "anivexa:megaplay", label: "Anivexa · MegaPlay", variants: ["sub", "dub"] },
  // MiruroAPI providers (requires MIRURO_API_BASE_URL env var)
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

