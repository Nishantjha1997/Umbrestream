/**
 * The recommendation scoring model (§7), kept pure and free of I/O.
 *
 * Nothing in here touches Supabase, TMDB, AniList, `next/headers`, or the
 * filesystem — every function is (inputs) -> outputs. That is deliberate:
 * `src/actions/recommendations.ts` is a "use server" module and therefore
 * unimportable from a test runner or a client component, so the arithmetic
 * that actually decides what a user sees lives here instead where it can be
 * exercised directly.
 *
 * The model has three stages:
 *
 *   1. `weighHistory`      raw history rows -> one weighted entry per title
 *   2. `buildGenreAffinity` weighted titles -> a normalized genre profile
 *   3. `scoreCandidate`    a candidate + the profile -> a single 0-1 score
 *
 * Stage 1 is the part the plan specifies exactly:
 *
 *   recency    = 0.5 ^ (ageDays / 30)      a 30-day half-life
 *   completion = min(1, percentWatched/80)  abandoned != watched
 *   replay     = 1 + log2(max(1, playCount))
 *   weight     = recency * completion * replay
 */

export type RecMediaType = "movie" | "tv" | "anime";

/** The subset of a `histories` row the model reads. */
export interface HistoryRowLike {
  media_id: number;
  type: string;
  duration: number;
  last_position: number;
  completed: boolean;
  updated_at: string;
  title?: string | null;
}

/** One title, with every history row for it collapsed into a single weight. */
export interface WeightedTitle {
  /** `${type}:${mediaId}` — the id spaces differ per type, so type is part of the key. */
  key: string;
  type: RecMediaType;
  mediaId: number;
  title: string;
  /** recency * completion * replay. Higher means "more like this". */
  weight: number;
  recency: number;
  completion: number;
  /** History rows collapsed into this title. For TV, distinct episodes count. */
  playCount: number;
  /** Epoch ms of the most recent row for this title. */
  lastWatchedAt: number;
}

/** Half-life of the recency term, in days. */
export const RECENCY_HALF_LIFE_DAYS = 30;

/**
 * Percent-watched at which a title counts as fully watched.
 *
 * 80 rather than 100 because credits, outros, and "next episode" autoplay mean
 * almost nobody reaches the final frame, and a viewer who stopped at 85% liked
 * it exactly as much as one who sat through the scroll.
 */
export const COMPLETION_TARGET_PERCENT = 80;

/**
 * Assumed percent-watched when a row has no duration.
 *
 * `histories.duration` defaults to 0 and the player only fills it in once
 * metadata has loaded, so older or interrupted rows genuinely do not know how
 * much was watched. Scoring those as 0% would silently delete them from the
 * profile; scoring them as 100% would let a two-second misclick outrank a
 * finished film. Half credit keeps them in the mix without letting them lead.
 */
export const UNKNOWN_DURATION_PERCENT = 40;

export const titleKey = (type: string, mediaId: number): string => `${type}:${mediaId}`;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const isRecMediaType = (value: string): value is RecMediaType =>
  value === "movie" || value === "tv" || value === "anime";

/** How much of a row was actually watched, 0-100. */
export function percentWatched(row: HistoryRowLike): number {
  if (row.completed) return 100;
  if (!row.duration || row.duration <= 0) return UNKNOWN_DURATION_PERCENT;
  return clamp((row.last_position / row.duration) * 100, 0, 100);
}

/** 0.5 ^ (ageDays / 30). Exactly 1 for something watched right now. */
export function recencyFactor(lastWatchedAt: number, now: number): number {
  const ageDays = Math.max(0, (now - lastWatchedAt) / 86_400_000);
  return Math.pow(0.5, ageDays / RECENCY_HALF_LIFE_DAYS);
}

/** 1 + log2(playCount). One play scores 1, two score 2, eight score 4. */
export function replayFactor(playCount: number): number {
  return 1 + Math.log2(Math.max(1, playCount));
}

/**
 * Collapse raw history rows into one weighted entry per title.
 *
 * Rows are grouped by `type:media_id`, so a series watched across 30 episodes
 * is one entry with `playCount: 30` rather than 30 competing entries that
 * would otherwise crowd every other title out of the profile.
 *
 * Within a group:
 * - recency comes from the newest row (when did you last touch this?)
 * - completion is the mean across rows (a dozen abandoned episodes should not
 *   read the same as a dozen finished ones)
 * - replay is the row count
 *
 * Returned sorted by weight, descending.
 */
export function weighHistory(rows: HistoryRowLike[], now: number = Date.now()): WeightedTitle[] {
  const groups = new Map<
    string,
    { type: RecMediaType; mediaId: number; title: string; completionSum: number; count: number; lastWatchedAt: number }
  >();

  for (const row of rows) {
    if (!row || !isRecMediaType(row.type)) continue;

    const key = titleKey(row.type, row.media_id);
    const watchedAt = Date.parse(row.updated_at);
    const group = groups.get(key);
    const completion = clamp(percentWatched(row) / COMPLETION_TARGET_PERCENT, 0, 1);

    if (group) {
      group.completionSum += completion;
      group.count += 1;
      if (Number.isFinite(watchedAt) && watchedAt > group.lastWatchedAt) {
        group.lastWatchedAt = watchedAt;
      }
      continue;
    }

    groups.set(key, {
      type: row.type,
      mediaId: row.media_id,
      title: row.title ?? "",
      completionSum: completion,
      count: 1,
      lastWatchedAt: Number.isFinite(watchedAt) ? watchedAt : now,
    });
  }

  const weighted: WeightedTitle[] = [];

  for (const [key, group] of groups) {
    const recency = recencyFactor(group.lastWatchedAt, now);
    const completion = group.completionSum / group.count;
    const replay = replayFactor(group.count);

    weighted.push({
      key,
      type: group.type,
      mediaId: group.mediaId,
      title: group.title,
      weight: recency * completion * replay,
      recency,
      completion,
      playCount: group.count,
      lastWatchedAt: group.lastWatchedAt,
    });
  }

  return weighted.sort((a, b) => b.weight - a.weight);
}

/**
 * A genre profile: `share` sums to 1 across all genres present.
 *
 * Kept as shares rather than raw weights so a candidate's affinity score is
 * directly interpretable — "this title covers 40% of your taste mass" — and so
 * the score stays on the same 0-1 scale as everything it is blended with,
 * regardless of how much history the user has.
 */
export interface GenreAffinity {
  share: Map<number, number>;
  /** Genre ids, most-loved first. */
  ranked: number[];
  /** Sum of the weights that went in. Zero means "no usable signal". */
  mass: number;
}

export const EMPTY_AFFINITY: GenreAffinity = { share: new Map(), ranked: [], mass: 0 };

/**
 * Build a genre profile from weighted titles.
 *
 * Each title spreads its weight evenly across its own genres, so a title tagged
 * with six genres does not get six times the vote of one tagged with two.
 *
 * `genresByKey` maps `type:media_id` to numeric genre ids — that is what the
 * `titles_cache` table exists to supply in a single query.
 */
export function buildGenreAffinity(
  titles: WeightedTitle[],
  genresByKey: Map<string, number[]>,
): GenreAffinity {
  const raw = new Map<number, number>();
  let mass = 0;

  for (const title of titles) {
    const genres = genresByKey.get(title.key);
    if (!genres || genres.length === 0 || title.weight <= 0) continue;

    const perGenre = title.weight / genres.length;
    for (const genre of genres) {
      raw.set(genre, (raw.get(genre) ?? 0) + perGenre);
      mass += perGenre;
    }
  }

  if (mass <= 0) return EMPTY_AFFINITY;

  const share = new Map<number, number>();
  for (const [genre, value] of raw) share.set(genre, value / mass);

  const ranked = [...share.entries()].sort((a, b) => b[1] - a[1]).map(([genre]) => genre);

  return { share, ranked, mass };
}

/** The fields a candidate needs to be scored. Everything else is passthrough. */
export interface CandidateSignals {
  genreIds: number[];
  /** Sum of the weights of the history titles that surfaced this candidate. */
  seedWeight: number;
  voteAverage: number;
  voteCount: number;
}

/** Weights of the three scoring terms. They sum to 1. */
export const SCORE_WEIGHTS = { affinity: 0.5, seed: 0.35, quality: 0.15 } as const;

/** Below this many votes, TMDB's average is noise rather than a quality signal. */
export const MIN_CONFIDENT_VOTES = 50;

/**
 * Score a single candidate in [0, 1].
 *
 * - affinity: how much of the user's taste mass this title's genres cover
 * - seed:     how strongly the history titles that surfaced it are weighted,
 *             normalized against the strongest seed in this run
 * - quality:  TMDB's rating, discounted when too few people have voted
 *
 * `maxSeedWeight` is passed in rather than derived so every candidate in a run
 * is normalized against the same denominator.
 */
export function scoreCandidate(
  signals: CandidateSignals,
  affinity: GenreAffinity,
  maxSeedWeight: number,
): number {
  let affinityScore = 0;
  for (const genre of signals.genreIds) affinityScore += affinity.share.get(genre) ?? 0;
  affinityScore = clamp(affinityScore, 0, 1);

  const seedScore = maxSeedWeight > 0 ? clamp(signals.seedWeight / maxSeedWeight, 0, 1) : 0;

  const confidence = signals.voteCount >= MIN_CONFIDENT_VOTES ? 1 : 0.6;
  const qualityScore = clamp((signals.voteAverage / 10) * confidence, 0, 1);

  return (
    SCORE_WEIGHTS.affinity * affinityScore +
    SCORE_WEIGHTS.seed * seedScore +
    SCORE_WEIGHTS.quality * qualityScore
  );
}

/**
 * How many of the final slots each media type should get.
 *
 * Proportional to the weight mass that type holds in the user's history, so
 * someone whose last month was 80% anime gets a mostly-anime row rather than
 * an even three-way split they never asked for. Every type with any history at
 * all is guaranteed at least one slot, so a single movie among 50 anime still
 * shows up.
 */
export function allocateSlots(
  titles: WeightedTitle[],
  total: number,
): Record<RecMediaType, number> {
  const mass: Record<RecMediaType, number> = { movie: 0, tv: 0, anime: 0 };
  for (const title of titles) mass[title.type] += title.weight;

  const totalMass = mass.movie + mass.tv + mass.anime;
  if (totalMass <= 0) {
    const even = Math.floor(total / 3);
    return { movie: total - 2 * even, tv: even, anime: even };
  }

  const present = (Object.keys(mass) as RecMediaType[]).filter((type) => mass[type] > 0);
  const budget = total - present.length; // one guaranteed slot each

  const slots: Record<RecMediaType, number> = { movie: 0, tv: 0, anime: 0 };
  let assigned = 0;

  for (const type of present) {
    const extra = Math.floor((mass[type] / totalMass) * budget);
    slots[type] = 1 + extra;
    assigned += slots[type];
  }

  // Hand the rounding remainder to the dominant type.
  const leader = present.reduce((a, b) => (mass[a] >= mass[b] ? a : b));
  slots[leader] += total - assigned;

  return slots;
}

/**
 * Round-robin merge, so the row reads as one mixed shelf rather than a block of
 * movies followed by a block of anime.
 */
export function interleave<T>(...lists: T[][]): T[] {
  const out: T[] = [];
  const longest = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < longest; i++) {
    for (const list of lists) {
      if (i < list.length) out.push(list[i]);
    }
  }
  return out;
}

/**
 * A short, stable fingerprint of a taste profile.
 *
 * Used as the server cache key: two page loads with the same profile must hit
 * the same cache entry, and pressing play on something new must miss it. The
 * `lastWatchedAt` of the newest title is folded in at day granularity so the
 * row refreshes as history ages without churning on every second.
 */
export function profileFingerprint(titles: WeightedTitle[], topN = 12): string {
  if (titles.length === 0) return "cold";
  const newestDay = Math.floor(Math.max(...titles.map((t) => t.lastWatchedAt)) / 86_400_000);
  const head = titles
    .slice(0, topN)
    .map((t) => `${t.key}@${t.playCount}`)
    .join(",");
  return `${newestDay}|${titles.length}|${head}`;
}
