"use server";

import { anilistApi } from "@/api/anilist";
import { tmdb } from "@/api/tmdb";
import { createClient } from "@/utils/supabase/server";
import {
  allocateSlots,
  buildGenreAffinity,
  EMPTY_AFFINITY,
  interleave,
  profileFingerprint,
  scoreCandidate,
  titleKey,
  weighHistory,
  type GenreAffinity,
  type RecMediaType,
  type WeightedTitle,
} from "@/utils/recommendations";
import { unstable_cache } from "next/cache";
import type { DiscoverQueryOptions } from "tmdb-ts";
import { getUserHistories } from "./histories";

/* -------------------------------------------------------------------------- */
/*  Overview                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Personalized "Recommended For You" (§7).
 *
 * The scoring model itself lives in `@/utils/recommendations` — pure, no I/O,
 * so it can be reasoned about and exercised without a database. This module is
 * the plumbing around it: read history, resolve genres, call the providers,
 * rank, dedupe, cache.
 *
 * Three things worth knowing before editing:
 *
 * 1. **This talks to TMDB server-side, via `@/api/tmdb`, not `tmdb-browser`.**
 *    The previous version imported `tmdbBrowser`, whose `proxy()` does
 *    `fetch("/api/tmdb/...")` — a relative URL. That is fine in a browser and
 *    throws `Failed to parse URL` in Node, so on the server every call failed
 *    and the row silently degraded to trending, always. Going direct also
 *    keeps the whole engine outside the /api/tmdb proxy's 60 req/min budget,
 *    which a per-history-row fan-out would otherwise blow through instantly.
 *
 * 2. **Genres come from `titles_cache`, not from N detail calls.**
 *    See `resolveGenres` and the migration
 *    `supabase/migrations/20260728120000_titles_cache.sql`. If that migration
 *    has not been applied, every read here fails soft and the engine keeps
 *    working on a bounded number of live detail lookups instead. A missing
 *    table must never take out the home page.
 *
 * 3. **Anime is scored, but not through TMDB.** See ANIME NOTE below.
 */

/* -------------------------------------------------------------------------- */
/*  Anime                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * ANIME NOTE — why anime history does not feed the TMDB leg.
 *
 * Anime rows in `histories` carry **AniList** ids, and AniList genres are
 * strings (`"Sci-Fi"`, `"Slice of Life"`) while TMDB uses numeric `genre_ids`
 * (878, 10751). The two id spaces are unrelated in both dimensions: AniList
 * #21 is One Piece, TMDB #21 is a 1930s German film. So:
 *
 * - Feeding anime ids into `tmdb.movies.recommendations()` would return
 *   confident nonsense.
 * - Mapping AniList genre strings onto TMDB genre ids is possible for the
 *   handful that share a name, but "Mecha", "Shounen", "Slice of Life" and
 *   "Ecchi" have no TMDB equivalent at all, and the ones that do map ("Action")
 *   mean something different in a catalogue of anime than in one of films.
 *   A lossy hand-written mapping table would quietly bias the whole profile.
 *
 * What happens instead: anime history is weighted by exactly the same
 * recency/completion/replay model, and the highest-weighted anime titles seed
 * **AniList's own** `Media.recommendations`. Anime therefore competes for row
 * slots on equal terms with movies and TV — `allocateSlots` hands each type a
 * share of the row proportional to its weight mass in the user's history — it
 * just gets its candidates from the provider that actually knows about it.
 *
 * Anime also always counts toward the watched-set used for deduping, so a
 * finished series can never reappear as a recommendation.
 *
 * Why seed-based rather than genre-based on the AniList side too: AniList's
 * list query in `@/api/anilist` exposes no `genre_in` variable and its summary
 * fragment does not select `genres`, so a genre-driven AniList discover would
 * mean editing that module. Seed recommendations give an equivalent signal for
 * one call per seed, and AniList's rate limit (~30 req/min) rewards restraint.
 */

/* -------------------------------------------------------------------------- */
/*  Types                                                                       */
/* -------------------------------------------------------------------------- */

export type RecommendedItem =
  | { type: "movie"; media: any }
  | { type: "tv"; media: any }
  | { type: "anime"; media: any };

/** A TMDB list entry, in the shape every list endpoint agrees on. */
interface TmdbListItem {
  id: number;
  genre_ids?: number[];
  vote_average?: number;
  vote_count?: number;
  poster_path?: string | null;
  [key: string]: unknown;
}

interface Seed {
  id: number;
  weight: number;
}

interface BuildInput {
  watched: string[];
  movieAffinity: [number, number][];
  tvAffinity: [number, number][];
  movieSeeds: Seed[];
  tvSeeds: Seed[];
  animeSeeds: Seed[];
  slots: Record<RecMediaType, number>;
}

/* -------------------------------------------------------------------------- */
/*  Tunables                                                                    */
/* -------------------------------------------------------------------------- */

/** Rows pulled for the watched-set. Deduping is only as good as this is deep. */
const HISTORY_DEPTH = 200;

/** Titles the genre profile is built from. Beyond this, recency has flattened them anyway. */
const PROFILE_DEPTH = 40;

/** "top ~5 seeds" (§7). Shared across all three media types, not per type. */
const MAX_SEEDS = 5;

/** Ceiling on live detail lookups per invocation when `titles_cache` misses. */
const MAX_DETAIL_FETCHES = 8;

/** Genres fed to /discover. More than three and the OR filter stops meaning anything. */
const DISCOVER_GENRES = 3;

/** Length of the finished row. */
const ROW_SIZE = 18;

/** Server-side cache lifetime for a computed row. */
const ROW_TTL_SECONDS = 1800;

/**
 * Weights are recomputed against a clock quantized to the hour.
 *
 * Recency decays continuously, so an un-quantized `Date.now()` would produce a
 * fractionally different profile on every single request and the server cache
 * below would never hit. An hour of staleness in a 30-day half-life is noise.
 */
const CLOCK_QUANTUM_MS = 3_600_000;

/* -------------------------------------------------------------------------- */
/*  Entry point                                                                 */
/* -------------------------------------------------------------------------- */

export async function getPersonalizedRecommendations(): Promise<RecommendedItem[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Cold start, case 1: nobody is signed in. Trending, not an error and not
    // an empty row.
    if (!user) return await cachedTrending();

    const historyRes = await getUserHistories(HISTORY_DEPTH);
    const rows = historyRes.success ? (historyRes.data ?? []) : [];

    // Cold start, case 2: signed in, has watched nothing.
    if (rows.length === 0) return await cachedTrending();

    const now = Math.floor(Date.now() / CLOCK_QUANTUM_MS) * CLOCK_QUANTUM_MS;
    const weighted = weighHistory(rows, now);

    // Dedupe against *everything* watched, not just what seeded the row.
    const watched = rows.map((row) => titleKey(row.type, row.media_id));

    const profile = weighted.slice(0, PROFILE_DEPTH);
    const genresByKey = await resolveGenres(supabase, profile);

    // TMDB's movie and TV genre vocabularies only partly overlap — 28 is
    // "Action" for film, 10759 "Action & Adventure" for TV — so pooling them
    // would produce a `with_genres` filter that means nothing on either
    // endpoint. Two profiles, kept apart.
    const movieAffinity = buildGenreAffinity(
      profile.filter((t) => t.type === "movie"),
      genresByKey,
    );
    const tvAffinity = buildGenreAffinity(
      profile.filter((t) => t.type === "tv"),
      genresByKey,
    );

    const seeds = weighted.slice(0, MAX_SEEDS);
    const input: BuildInput = {
      watched,
      movieAffinity: serializeAffinity(movieAffinity),
      tvAffinity: serializeAffinity(tvAffinity),
      movieSeeds: seedsOfType(seeds, "movie"),
      tvSeeds: seedsOfType(seeds, "tv"),
      animeSeeds: seedsOfType(seeds, "anime"),
      slots: allocateSlots(profile, ROW_SIZE),
    };

    const fingerprint = profileFingerprint(weighted);
    const row = await buildRowCached(user.id, fingerprint, input);

    // Everything failed upstream but nothing threw — still better to show the
    // charts than an empty section.
    return row.length > 0 ? row : await cachedTrending();
  } catch (error) {
    console.error("Failed to build recommendations:", error);
    return await cachedTrending();
  }
}

/* -------------------------------------------------------------------------- */
/*  Server-side caching                                                         */
/* -------------------------------------------------------------------------- */

/**
 * The computed row, cached per (user, taste fingerprint).
 *
 * §7 requires the row to be cached rather than recomputed on every navigation.
 * There are two layers: this one, in Next's data cache, shared across every
 * request from the same user; and react-query's `staleTime` in
 * `Home/Recommended.tsx`, which stops the client re-invoking the action at all
 * while moving around the app.
 *
 * The fingerprint is part of the key on purpose — pressing play on something
 * new should change the row immediately, not in half an hour.
 *
 * `unstable_cache` refuses to run around anything that touches `cookies()`, so
 * every Supabase read happens *before* this and only plain serializable data
 * crosses the boundary. If Next ever rejects the call anyway, the catch falls
 * through to computing it inline — a slow row beats no row.
 */
const buildRowCached = async (
  userId: string,
  fingerprint: string,
  input: BuildInput,
): Promise<RecommendedItem[]> => {
  try {
    const run = unstable_cache(
      async (payload: string) => buildRow(JSON.parse(payload) as BuildInput),
      ["personalized-recommendations", "v1", userId, fingerprint],
      { revalidate: ROW_TTL_SECONDS, tags: [`recommendations:${userId}`] },
    );
    return await run(JSON.stringify(input));
  } catch (error) {
    console.error("Recommendation cache unavailable, computing inline:", error);
    return await buildRow(input);
  }
};

const cachedTrending = async (): Promise<RecommendedItem[]> => {
  try {
    const run = unstable_cache(fetchTrendingBlend, ["recommendations-trending", "v1"], {
      revalidate: ROW_TTL_SECONDS,
    });
    return await run();
  } catch {
    return await fetchTrendingBlend();
  }
};

/* -------------------------------------------------------------------------- */
/*  Genre resolution — the titles_cache leg                                     */
/* -------------------------------------------------------------------------- */

/**
 * Remembered failure of the `titles_cache` read.
 *
 * The table may simply not exist yet — the migration ships with this feature
 * and has to be applied separately. Re-issuing a query that is guaranteed to
 * 404 on every home page load is pure latency, so a failure is remembered for
 * a few minutes and then retried, which means the engine starts using the
 * table on its own once someone applies the migration. No redeploy needed.
 */
const CACHE_PROBE_BACKOFF_MS = 5 * 60_000;
let titlesCacheUnavailableUntil = 0;

/**
 * In-process genre memo, sitting in front of `titles_cache`.
 *
 * Genres never change, so this needs no TTL. It matters most when the
 * migration has *not* been applied: without it, the bounded live-lookup
 * fallback would re-fetch the same eight titles on every single home page
 * load, since there is nowhere to write the answer back to. Bounded by a
 * hard clear so a long-lived instance cannot grow it without limit.
 */
const MEMO_LIMIT = 5000;
const genreMemo = new Map<string, number[]>();

function memoGenres(key: string, genreIds: number[]): void {
  if (genreMemo.size >= MEMO_LIMIT) genreMemo.clear();
  genreMemo.set(key, genreIds);
}

/** Minimal structural view of the client — `titles_cache` is not in the generated Database type. */
interface UntypedSupabase {
  from(table: string): any;
}

interface TitlesCacheRow {
  title_key: string;
  media_type: string;
  source_id: number;
  tmdb_id: number | null;
  genre_ids: number[] | null;
  genre_names: string[] | null;
}

/**
 * `type:media_id` -> numeric TMDB genre ids, for as many profile titles as can
 * be resolved cheaply.
 *
 * One indexed Postgres query covers everything already seen by anyone. Only
 * the highest-weighted misses trigger a live detail lookup, and never more
 * than `MAX_DETAIL_FETCHES` of them, so the cost is bounded no matter how much
 * history a user has. Those results are written back, so the cache warms
 * itself over a few page loads.
 *
 * Anime rows are read from the cache when present but never trigger a live
 * lookup: their genres are AniList strings, which by design contribute nothing
 * to the numeric TMDB profile (see ANIME NOTE), so spending an AniList call —
 * against a ~30 req/min limit — to learn them would buy nothing. They resolve
 * to an empty genre list, which is the honest answer for a TMDB profile.
 */
async function resolveGenres(
  supabase: unknown,
  profile: WeightedTitle[],
): Promise<Map<string, number[]>> {
  const resolved = new Map<string, number[]>();
  if (profile.length === 0) return resolved;

  const db = supabase as UntypedSupabase;

  for (const title of profile) {
    const memoized = genreMemo.get(title.key);
    if (memoized) resolved.set(title.key, memoized);
    else if (title.type === "anime") resolved.set(title.key, []);
  }

  const keys = profile.filter((t) => !resolved.has(t.key)).map((t) => t.key);
  const cacheUsable = keys.length > 0 && Date.now() >= titlesCacheUnavailableUntil;

  if (cacheUsable) {
    try {
      const { data, error } = await db
        .from("titles_cache")
        .select("title_key, media_type, source_id, tmdb_id, genre_ids, genre_names")
        .in("title_key", keys);

      if (error) throw error;

      for (const row of (data ?? []) as TitlesCacheRow[]) {
        resolved.set(row.title_key, row.genre_ids ?? []);
        memoGenres(row.title_key, row.genre_ids ?? []);
      }
    } catch (error) {
      // Almost always "relation public.titles_cache does not exist" (42P01 /
      // PGRST205) on a deployment that has not run the migration yet.
      titlesCacheUnavailableUntil = Date.now() + CACHE_PROBE_BACKOFF_MS;
      console.warn(
        "titles_cache unavailable — falling back to bounded live genre lookups. " +
          "Apply supabase/migrations/20260728120000_titles_cache.sql to fix.",
        error,
      );
    }
  }

  const misses = profile.filter((t) => !resolved.has(t.key)).slice(0, MAX_DETAIL_FETCHES);
  if (misses.length === 0) return resolved;

  const fetched = await Promise.all(misses.map(fetchTitleMetadata));
  const writable: TitlesCacheRow[] = [];

  for (const entry of fetched) {
    if (!entry) continue;
    resolved.set(entry.title_key, entry.genre_ids ?? []);
    memoGenres(entry.title_key, entry.genre_ids ?? []);
    writable.push(entry);
  }

  if (writable.length > 0 && Date.now() >= titlesCacheUnavailableUntil) {
    // Awaited rather than fired-and-forgotten: on a serverless host the
    // response ends the invocation, and a detached promise would be killed
    // before it committed — leaving the cache permanently cold.
    await persistTitlesCache(db, writable);
  }

  return resolved;
}

/**
 * One live TMDB lookup for a title whose genres were not cached.
 *
 * Only ever reached for movies and TV — `resolveGenres` short-circuits anime
 * before the miss list is built.
 */
async function fetchTitleMetadata(title: WeightedTitle): Promise<TitlesCacheRow | null> {
  if (title.type === "anime") return null;

  try {
    if (title.type === "movie") {
      const details = await tmdb.movies.details(title.mediaId);
      return {
        title_key: title.key,
        media_type: "movie",
        source_id: title.mediaId,
        tmdb_id: title.mediaId,
        genre_ids: (details.genres ?? []).map((g) => g.id),
        genre_names: (details.genres ?? []).map((g) => g.name),
      };
    }

    const details = await tmdb.tvShows.details(title.mediaId);
    return {
      title_key: title.key,
      media_type: "tv",
      source_id: title.mediaId,
      tmdb_id: title.mediaId,
      genre_ids: (details.genres ?? []).map((g) => g.id),
      genre_names: (details.genres ?? []).map((g) => g.name),
    };
  } catch (error) {
    console.warn(`Genre lookup failed for ${title.key}:`, error);
    return null;
  }
}

/**
 * Write freshly-fetched metadata back to the cache.
 *
 * Failures are swallowed: a cache that will not accept writes is a performance
 * problem for the next visitor, never a reason to fail this user's row.
 */
async function persistTitlesCache(db: UntypedSupabase, rows: TitlesCacheRow[]): Promise<void> {
  try {
    const { error } = await db
      .from("titles_cache")
      .upsert(
        rows.map((row) => ({ ...row, refreshed_at: new Date().toISOString() })),
        { onConflict: "title_key" },
      );
    if (error) throw error;
  } catch (error) {
    console.warn("Failed to write titles_cache:", error);
  }
}

/* -------------------------------------------------------------------------- */
/*  Row construction                                                            */
/* -------------------------------------------------------------------------- */

async function buildRow(input: BuildInput): Promise<RecommendedItem[]> {
  const watched = new Set(input.watched);
  const movieAffinity = deserializeAffinity(input.movieAffinity);
  const tvAffinity = deserializeAffinity(input.tvAffinity);

  const maxSeedWeight = Math.max(
    0,
    ...[...input.movieSeeds, ...input.tvSeeds, ...input.animeSeeds].map((s) => s.weight),
  );

  const [movies, tvShows, anime] = await Promise.all([
    collectTmdb("movie", input.movieSeeds, movieAffinity, watched, maxSeedWeight),
    collectTmdb("tv", input.tvSeeds, tvAffinity, watched, maxSeedWeight),
    collectAnime(input.animeSeeds, watched, maxSeedWeight),
  ]);

  const picked = interleave(
    movies.slice(0, input.slots.movie),
    tvShows.slice(0, input.slots.tv),
    anime.slice(0, input.slots.anime),
  );

  // Slots are proportional to taste, but a type can under-deliver (a seed with
  // no recommendations, a discover page full of already-watched titles). Refill
  // from whatever the other types had left over before reaching for trending.
  const seen = new Set(picked.map((item) => titleKey(item.type, item.media.id)));
  const out = [...picked];

  if (out.length < ROW_SIZE) {
    for (const item of interleave(movies, tvShows, anime)) {
      if (out.length >= ROW_SIZE) break;
      const key = titleKey(item.type, item.media.id);
      if (seen.has(key) || watched.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
  }

  if (out.length < ROW_SIZE) {
    for (const item of await fetchTrendingBlend()) {
      if (out.length >= ROW_SIZE) break;
      const key = titleKey(item.type, item.media.id);
      if (seen.has(key) || watched.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
  }

  return out.slice(0, ROW_SIZE);
}

/**
 * Candidates for one TMDB media type, ranked.
 *
 * Two sources, blended and scored together:
 *
 * - `/recommendations` for each seed — TMDB's own collaborative signal, which
 *   knows things a genre filter never will ("people who watched Arrival also
 *   watched Annihilation").
 * - `/discover` weighted by the genre profile — which is what makes ten
 *   watched sci-fi titles produce a *visibly* sci-fi row rather than five
 *   near-neighbours of the last thing played.
 */
async function collectTmdb(
  type: "movie" | "tv",
  seeds: Seed[],
  affinity: GenreAffinity,
  watched: Set<string>,
  maxSeedWeight: number,
): Promise<RecommendedItem[]> {
  if (seeds.length === 0 && affinity.ranked.length === 0) return [];

  const seedWeightById = new Map<number, number>();
  const candidates = new Map<number, TmdbListItem>();

  const absorb = (items: TmdbListItem[] | undefined, seedWeight: number) => {
    for (const item of items ?? []) {
      if (!item?.id) continue;
      if (watched.has(titleKey(type, item.id))) continue;
      if (!item.poster_path) continue; // a card with no artwork is a hole in the row
      if (!candidates.has(item.id)) candidates.set(item.id, item);
      if (seedWeight > 0) {
        seedWeightById.set(item.id, (seedWeightById.get(item.id) ?? 0) + seedWeight);
      }
    }
  };

  const requests: Promise<{ items: TmdbListItem[]; seedWeight: number }>[] = [];

  for (const seed of seeds) {
    requests.push(
      (async () => {
        try {
          const res =
            type === "movie"
              ? await tmdb.movies.recommendations(seed.id)
              : await tmdb.tvShows.recommendations(seed.id);
          return { items: (res?.results ?? []) as unknown as TmdbListItem[], seedWeight: seed.weight };
        } catch (error) {
          console.warn(`TMDB recommendations failed for ${type}:${seed.id}:`, error);
          return { items: [], seedWeight: 0 };
        }
      })(),
    );
  }

  const top = affinity.ranked.slice(0, DISCOVER_GENRES);
  if (top.length > 0) {
    // Two passes over /discover: one broad and popular across the whole
    // profile (OR), one narrow and well-rated on the single dominant genre.
    // The first keeps the row current, the second keeps it from being a
    // popularity chart with extra steps.
    // DiscoverQueryOptions is the intersection of what /discover/movie and
    // /discover/tv both accept, so one array serves both endpoints.
    const queries: DiscoverQueryOptions[] = [
      {
        with_genres: top.join("|"),
        sort_by: "popularity.desc",
        "vote_count.gte": 100,
        include_adult: false,
      },
      {
        with_genres: String(top[0]),
        sort_by: "vote_average.desc",
        "vote_count.gte": 300,
        include_adult: false,
      },
    ];

    for (const query of queries) {
      requests.push(
        (async () => {
          try {
            const res =
              type === "movie"
                ? await tmdb.discover.movie(query)
                : await tmdb.discover.tvShow(query);
            return { items: (res?.results ?? []) as unknown as TmdbListItem[], seedWeight: 0 };
          } catch (error) {
            console.warn(`TMDB discover failed for ${type}:`, error);
            return { items: [], seedWeight: 0 };
          }
        })(),
      );
    }
  }

  for (const { items, seedWeight } of await Promise.all(requests)) absorb(items, seedWeight);

  return [...candidates.values()]
    .map((media) => ({
      media,
      score: scoreCandidate(
        {
          genreIds: media.genre_ids ?? [],
          seedWeight: seedWeightById.get(media.id) ?? 0,
          voteAverage: media.vote_average ?? 0,
          voteCount: media.vote_count ?? 0,
        },
        affinity,
        maxSeedWeight,
      ),
    }))
    .sort((a, b) => b.score - a.score)
    .map(({ media }) => ({ type, media }) as RecommendedItem);
}

/**
 * Candidates from AniList, ranked.
 *
 * Genre affinity is deliberately absent here — see ANIME NOTE. The ranking is
 * seed weight (how much you liked the thing this came from) plus AniList's own
 * average score, on the same 0-1 scale the TMDB leg uses so the two are
 * comparable when the row is interleaved.
 */
async function collectAnime(
  seeds: Seed[],
  watched: Set<string>,
  maxSeedWeight: number,
): Promise<RecommendedItem[]> {
  if (seeds.length === 0) return [];

  const candidates = new Map<number, { media: any; seedWeight: number }>();

  const results = await Promise.all(
    seeds.map(async (seed) => {
      try {
        const details = await anilistApi.details(seed.id);
        return { recommendations: details?.recommendations ?? [], seedWeight: seed.weight };
      } catch (error) {
        console.warn(`AniList recommendations failed for anime:${seed.id}:`, error);
        return { recommendations: [], seedWeight: 0 };
      }
    }),
  );

  for (const { recommendations, seedWeight } of results) {
    for (const media of recommendations) {
      if (!media?.id) continue;
      if (watched.has(titleKey("anime", media.id))) continue;
      if (media.isAdult) continue;
      const existing = candidates.get(media.id);
      if (existing) existing.seedWeight += seedWeight;
      else candidates.set(media.id, { media, seedWeight });
    }
  }

  return [...candidates.values()]
    .map(({ media, seedWeight }) => ({
      media,
      score: scoreCandidate(
        {
          genreIds: [],
          seedWeight,
          // AniList scores 0-100 and has no public vote count; treat a scored
          // title as confidently rated, an unscored one as unknown.
          voteAverage: (media.averageScore ?? 0) / 10,
          voteCount: media.averageScore != null ? 1000 : 0,
        },
        EMPTY_AFFINITY,
        maxSeedWeight,
      ),
    }))
    .sort((a, b) => b.score - a.score)
    .map(({ media }) => ({ type: "anime", media }) as RecommendedItem);
}

/* -------------------------------------------------------------------------- */
/*  Cold start                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The zero-history answer: today's trending, interleaved across all three
 * providers. Every leg fails independently, so a dead AniList still leaves a
 * populated row rather than an error state.
 */
async function fetchTrendingBlend(): Promise<RecommendedItem[]> {
  try {
    const [movies, tvShows, anime] = await Promise.all([
      tmdb.trending.trending("movie", "day").catch(() => ({ results: [] })),
      tmdb.trending.trending("tv", "day").catch(() => ({ results: [] })),
      anilistApi.trending().catch(() => ({ media: [] })),
    ]);

    const hasArt = (m: any) => Boolean(m?.poster_path);

    return interleave<RecommendedItem>(
      ((movies?.results ?? []) as any[]).filter(hasArt).slice(0, 6).map((media) => ({ type: "movie", media })),
      ((tvShows?.results ?? []) as any[]).filter(hasArt).slice(0, 6).map((media) => ({ type: "tv", media })),
      ((anime?.media ?? []) as any[]).slice(0, 6).map((media) => ({ type: "anime", media })),
    ).slice(0, ROW_SIZE);
  } catch (error) {
    console.error("Failed to fetch fallback trending items:", error);
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/*  Serialization helpers                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Affinity maps have to cross a JSON boundary to become part of the cache key.
 * Entries are sorted and shares rounded so that an unchanged profile always
 * produces a byte-identical payload — otherwise float noise or Map ordering
 * would miss the cache on every request.
 */
function serializeAffinity(affinity: GenreAffinity): [number, number][] {
  return [...affinity.share.entries()]
    .map(([genre, share]) => [genre, Math.round(share * 10_000) / 10_000] as [number, number])
    .sort((a, b) => b[1] - a[1] || a[0] - b[0]);
}

function deserializeAffinity(entries: [number, number][]): GenreAffinity {
  if (entries.length === 0) return EMPTY_AFFINITY;
  return {
    share: new Map(entries),
    ranked: entries.map(([genre]) => genre),
    mass: entries.reduce((sum, [, share]) => sum + share, 0),
  };
}

function seedsOfType(seeds: WeightedTitle[], type: RecMediaType): Seed[] {
  return seeds
    .filter((seed) => seed.type === type)
    .map((seed) => ({ id: seed.mediaId, weight: Math.round(seed.weight * 10_000) / 10_000 }));
}
