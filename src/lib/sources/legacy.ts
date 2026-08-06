import type { MediaType } from "@/types/title";

const LEGACY_SOURCE_ORDER: Record<MediaType, string[]> = {
  movie: [
    "vidlink",
    "vidlink-alt",
    "vidking",
    "embed-su",
    "autoembed",
    "autoembed-player",
    "vidsrc-v3",
    "vidsrc-icu",
    "vidsrc-to",
    "vidsrc-xyz",
    "superembed",
    "filmku",
    "nontongo",
    "two-embed",
    "moviesapi",
  ],
  tv: [
    "vidking",
    "vidlink",
    "vidlink-alt",
    "embed-su",
    "autoembed",
    "autoembed-player",
    "vidsrc-v3",
    "vidsrc-icu",
    "vidsrc-to",
    "vidsrc-xyz",
    "superembed",
    "filmku",
    "nontongo",
    "two-embed",
    "moviesapi",
  ],
  anime: [
    "anilink-sub",
    "anilink-dub",
    "vidking",
    "embed-su",
    "autoembed-player",
    "autoembed",
    "vidsrc-v3",
    "vidsrc-icu",
    "superembed",
    "two-embed",
  ],
};

export function legacySourceId(mediaType: MediaType, value: string | null): string | null {
  if (!value) return value;
  if (!/^\d+$/.test(value)) {
    if (value === "vidlink-alt") return "vidlink-native";
    if (value === "cinesrc") return "cinezo";
    if (mediaType === "anime") {
      if (value === "vidlink" || value === "vidlink-anime-sub" || value === "cinezo-anime-sub") {
        return "anilink-sub";
      }
      if (value === "vidlink-anime-dub" || value === "cinezo-anime-dub") return "anilink-dub";
    }
    return value;
  }
  return LEGACY_SOURCE_ORDER[mediaType][Number(value)] ?? null;
}
