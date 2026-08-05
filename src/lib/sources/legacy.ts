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
    "vidlink",
    "vidlink-alt",
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
  if (!value || !/^\d+$/.test(value)) return value;
  return LEGACY_SOURCE_ORDER[mediaType][Number(value)] ?? null;
}
