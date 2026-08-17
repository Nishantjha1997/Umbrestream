import type { MediaSummary } from "@/types/media";

export interface ContinueWatchingSummary {
  mediaId: number;
  mediaType: "movie" | "tv" | "anime";
  season: number;
  episode: number;
  lastPosition: number;
  duration: number;
  progressPercent: number;
}

export type HomeFeedRowKind =
  | "continue"
  | "personalized"
  | "regional_movie"
  | "regional_tv"
  | "anime"
  | "trending";

export interface HomeFeedResponseV1 {
  schemaVersion: 1;
  region: {
    detectedCountry: string;
    effectiveCountry: string;
    countryName: string;
    source: "edge" | "override" | "default";
  };
  provenance: "history" | "personalized" | "cold_start" | "signed_out" | "fallback";
  hero: {
    intent: "resume" | "personalized" | "trending";
    media: MediaSummary;
    progress?: ContinueWatchingSummary;
  } | null;
  rows: Array<{
    id: string;
    title: string;
    kind: HomeFeedRowKind;
    items: MediaSummary[];
    nextCursor?: string;
  }>;
  generatedAt: string;
}
