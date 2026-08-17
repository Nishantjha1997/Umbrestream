import { anilistApi } from "@/api/anilist";
import { tmdb } from "@/api/tmdb";
import type { HistoryDetail } from "@/types/movie";
import type { MediaSummary } from "@/types/media";
import type { Movie, TV } from "tmdb-ts/dist/types";
import { fromAnime, fromMovie, fromTvShow } from "@/utils/normalize-media";
import { getImageUrl } from "@/utils/movies";
import { createClient } from "@/utils/supabase/server";
import { isSupabaseConfigured } from "@/utils/supabase/config";
import type { ContinueWatchingSummary, HomeFeedResponseV1, HomeFeedRowKind } from "./types";
import { latestIncompleteByTitle } from "@/lib/history/continueWatching";
import { dedupeHomeRows } from "./dedupe";

const DEFAULT_COUNTRY = "US";
const PAGE_SIZE = 24;

async function safeQuery<T>(query: () => Promise<T>, fallback: Partial<T>): Promise<T> {
  // The API clients intentionally expose lazy proxies. A missing token can
  // therefore throw while resolving a nested method, before a promise exists
  // for a call-site `.catch()` to observe. Keep every upstream lookup behind
  // one synchronous-and-async boundary so the feed contract remains valid.
  try {
    return await query();
  } catch {
    return fallback as T;
  }
}

interface FeedOptions {
  accessToken?: string;
  country?: string | null;
  detectedCountry?: string | null;
  countryOverride?: string | null;
  countrySource?: "edge" | "override" | "default";
}

interface Region {
  detectedCountry: string;
  effectiveCountry: string;
  countryName: string;
  source: "edge" | "override" | "default";
}

function safeCountry(country?: string | null): string {
  const normalized = country?.trim().toUpperCase();
  return normalized && /^[A-Z]{2}$/.test(normalized) ? normalized : DEFAULT_COUNTRY;
}

function getRegion(options: FeedOptions): Region {
  const detectedCountry = safeCountry(options.detectedCountry ?? options.country);
  const override = options.countryOverride?.trim().toUpperCase();
  const effectiveCountry = override && /^[A-Z]{2}$/.test(override)
    ? override
    : safeCountry(options.country ?? detectedCountry);
  const source = options.countrySource ?? (override ? "override" : detectedCountry === DEFAULT_COUNTRY ? "default" : "edge");
  let countryName = effectiveCountry;
  try {
    countryName = new Intl.DisplayNames(["en"], { type: "region" }).of(effectiveCountry) ?? effectiveCountry;
  } catch {
    // An invalid runtime locale must never stop a catalogue response.
  }
  return { detectedCountry, effectiveCountry, countryName, source };
}

function unique(items: MediaSummary[], limit = 24): MediaSummary[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.kind}:${item.id}`;
    if (seen.has(key) || !item.posterUrl || item.isAdult) return false;
    seen.add(key);
    return true;
  }).slice(0, limit);
}

function summaryFromHistory(history: HistoryDetail): MediaSummary {
  const kind = history.type as MediaSummary["kind"];
  return {
    kind,
    id: history.media_id,
    href: kind === "movie" ? `/movie/${history.media_id}` : `/${kind}/${history.media_id}`,
    title: history.title,
    posterUrl: getImageUrl(history.poster_path ?? history.backdrop_path ?? "", "poster"),
    backdropUrl: history.backdrop_path
      ? getImageUrl(history.backdrop_path, "backdrop")
      : undefined,
    year: history.release_date ? Number.parseInt(history.release_date.slice(0, 4), 10) : undefined,
    rating: history.vote_average > 0 ? history.vote_average : undefined,
    isAdult: history.adult,
  };
}

function progressFor(history: HistoryDetail): ContinueWatchingSummary {
  return {
    mediaId: history.media_id,
    mediaType: history.type as ContinueWatchingSummary["mediaType"],
    season: history.season,
    episode: history.episode,
    lastPosition: history.last_position,
    duration: history.duration,
    progressPercent:
      history.duration > 0 ? Math.min(100, (history.last_position / history.duration) * 100) : 0,
  };
}

interface ContinueWatchingResult {
  items: HistoryDetail[];
  authenticated: boolean;
}

async function loadContinueWatching(accessToken?: string): Promise<ContinueWatchingResult> {
  if (!accessToken || !isSupabaseConfigured) return { items: [], authenticated: false };
  try {
    const supabase = await createClient(false, accessToken);
    const { data: auth } = await supabase.auth.getUser(accessToken);
    if (!auth.user) return { items: [], authenticated: false };

    const { data: rpcRows, error: rpcError } = await supabase.rpc("get_continue_watching_page", {
      p_limit: PAGE_SIZE,
      p_cursor_updated_at: null,
      p_cursor_id: null,
    });
    if (!rpcError) return { items: (rpcRows ?? []) as HistoryDetail[], authenticated: true };

    // Additive migration fallback: older production databases still return a
    // useful title-level feed while the RPC is being deployed.
    const { data: rows } = await supabase
      .from("histories")
      .select("*")
      .eq("user_id", auth.user.id)
      .eq("completed", false)
      .order("updated_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(100);
    const items = latestIncompleteByTitle((rows ?? []) as HistoryDetail[]).slice(0, PAGE_SIZE);
    return { items, authenticated: true };
  } catch {
    return { items: [], authenticated: false };
  }
}

function row(id: string, title: string, kind: HomeFeedRowKind, items: MediaSummary[]) {
  return { id, title, kind, items: unique(items) };
}

export async function buildHomeFeed(options: FeedOptions = {}): Promise<HomeFeedResponseV1> {
  const region = getRegion(options);
  const params = {
    region: region.effectiveCountry,
    watch_region: region.effectiveCountry,
    sort_by: "popularity.desc" as const,
    with_watch_monetization_types: "flatrate" as const,
  };

  const [trendingMovies, trendingTv, regionalMovies, regionalTv, anime, historyResult] = await Promise.all([
    safeQuery(() => tmdb.trending.trending("movie", "day"), { results: [] }),
    safeQuery(() => tmdb.trending.trending("tv", "day"), { results: [] }),
    safeQuery(() => tmdb.discover.movie(params), { results: [] }),
    safeQuery(() => tmdb.discover.tvShow(params), { results: [] }),
    safeQuery(() => anilistApi.trending(), { media: [] }),
    loadContinueWatching(options.accessToken),
  ]);

  const histories = historyResult.items;
  const continueItems = histories.map(summaryFromHistory);
  const trendingItems = unique([
    ...(trendingMovies.results as unknown as Movie[]).map(fromMovie),
    ...(trendingTv.results as unknown as TV[]).map(fromTvShow),
  ]);
  const regionalMovieItems = unique(regionalMovies.results.map(fromMovie));
  const regionalTvItems = unique(regionalTv.results.map(fromTvShow));
  const animeItems = unique(anime.media.map(fromAnime));
  const signedIn = historyResult.authenticated;
  const hasHistory = histories.length > 0;
  const personalizedItems = hasHistory
    ? unique([...regionalMovieItems, ...regionalTvItems, ...animeItems])
    : [];
  const provenance: HomeFeedResponseV1["provenance"] =
    continueItems.length > 0
      ? "history"
      : signedIn
        ? hasHistory
          ? personalizedItems.length > 0
            ? "personalized"
            : "fallback"
          : "cold_start"
        : trendingItems.length > 0
          ? "signed_out"
          : "fallback";
  const heroMedia = continueItems[0] ?? personalizedItems[0] ?? trendingItems[0] ?? null;
  const hero = heroMedia
    ? continueItems[0]
      ? { intent: "resume" as const, media: heroMedia, progress: progressFor(histories[0]) }
      : {
          intent: provenance === "personalized" ? ("personalized" as const) : ("trending" as const),
          media: heroMedia,
        }
    : null;

  const displayCountry = region.source === "default" && region.effectiveCountry === DEFAULT_COUNTRY
    ? "Global"
    : region.countryName;
  const rows = dedupeHomeRows([
    ...(continueItems.length > 0 ? [row("continue", "Continue Watching", "continue", continueItems)] : []),
    ...(personalizedItems.length > 0 && signedIn && hasHistory
      ? [row("personalized", "Picked for you", "personalized", personalizedItems)]
      : []),
    row("regional-movies", `${displayCountry} trending movies`, "regional_movie", regionalMovieItems),
    row("regional-tv", `${displayCountry} trending series`, "regional_tv", regionalTvItems),
    row("anime", "Trending anime", "anime", animeItems),
    row("trending", "Trending now", "trending", trendingItems),
  ]);

  return {
    schemaVersion: 1,
    region,
    provenance,
    hero,
    rows,
    generatedAt: new Date().toISOString(),
  };
}
