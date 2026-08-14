"use server";

import { tmdb } from "@/api/tmdb";
import { anilistApi } from "@/api/anilist";
import { UnifiedPlayerEventData } from "@/hooks/usePlayerEvents";
import { ActionResponse, ContentType } from "@/types";
import { HistoryDetail } from "@/types/movie";
import { mutateMovieTitle, mutateTvShowTitle } from "@/utils/movies";
import { createClient } from "@/utils/supabase/server";

export const syncHistory = async (
  data: UnifiedPlayerEventData,
  completed?: boolean,
): ActionResponse => {
  // Was `console.info("Saving history:", data)` on entry — i.e. before the auth
  // check, so any unauthenticated caller could write arbitrary attacker-chosen
  // content into the platform logs for free (log injection / log flooding), and
  // every genuine save spilled viewing activity into a system with a different
  // retention policy and a wider audience than the database.
  if (!data) return { success: false, message: "No data to save" };

  if (data.mediaType === "tv" && (!data.season || !data.episode)) {
    return { success: false, message: "Missing season or episode" };
  }

  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        message: "You must be logged in to save history",
      };
    }

    // Validate required fields
    if (!data.mediaId || !data.mediaType) {
      return {
        success: false,
        message: "Missing required fields",
      };
    }

    // Validate type
    if (!["movie", "tv", "anime"].includes(data.mediaType)) {
      return {
        success: false,
        message: 'Invalid content type. Must be "movie", "tv", or "anime"',
      };
    }

    // TMDB movie/TV and AniList details intentionally have different shapes;
    // the media-type branches below narrow them before each field is used.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let media: any;
    if (data.mediaType === "movie") {
      media = await tmdb.movies.details(Number(data.mediaId));
    } else if (data.mediaType === "tv") {
      media = await tmdb.tvShows.details(Number(data.mediaId));
    } else if (data.mediaType === "anime") {
      media = await anilistApi.details(Number(data.mediaId));
    }

    if (!media) {
      return {
        success: false,
        message: "Failed to retrieve media details",
      };
    }

    // Map properties based on media type
    const isAnime = data.mediaType === "anime";
    const releaseDate = isAnime
      ? media.startDate?.year
        ? `${media.startDate.year}-${String(media.startDate.month || 1).padStart(2, "0")}-${String(media.startDate.day || 1).padStart(2, "0")}`
        : new Date().toISOString().split("T")[0]
      : "release_date" in media
        ? media.release_date
        : media.first_air_date;

    const titleStr = isAnime
      ? media.title.english || media.title.romaji || "Untitled"
      : "title" in media
        ? mutateMovieTitle(media)
        : mutateTvShowTitle(media);

    const voteAverage = isAnime ? (media.averageScore || 0) / 10 : media.vote_average;
    const isAdult = isAnime ? media.isAdult || false : "adult" in media ? media.adult : false;
    const posterPath = isAnime
      ? media.coverImage.extraLarge || media.coverImage.large || ""
      : media.poster_path;
    const backdropPath = isAnime ? media.bannerImage || "" : media.backdrop_path;

    const season = data.season || 0;
    const episode = data.episode || 0;

    // How much of this session actually counts as "watched", not summed
    // final positions — see `syncHistory`'s doc comment for why. A rewatch
    // climbs from a low position through positive deltas exactly like a
    // first watch, so it accumulates a second time instead of being masked
    // by an overwritten `last_position`.
    const { data: existing } = await supabase
      .from("histories")
      .select("last_position, updated_at, total_watched_seconds")
      .eq("user_id", user.id)
      .eq("media_id", Number(data.mediaId))
      .eq("type", data.mediaType)
      .eq("season", season)
      .eq("episode", episode)
      .maybeSingle();

    let credited: number;
    if (existing) {
      const delta = data.currentTime - existing.last_position;
      const wallClockElapsed = (Date.now() - new Date(existing.updated_at).getTime()) / 1000;
      credited = Math.min(Math.max(delta, 0), wallClockElapsed + 15);
    } else {
      // No prior row: nothing to diff against yet, so the position reached
      // on this first save is the best available estimate of time watched.
      credited = Math.max(data.currentTime, 0);
    }
    const totalWatchedSeconds = (existing?.total_watched_seconds ?? 0) + credited;

    // Insert or update history
    const { data: history, error } = await supabase
      .from("histories")
      .upsert(
        {
          user_id: user.id,
          media_id: Number(data.mediaId),
          type: data.mediaType,
          season,
          episode,
          duration: data.duration,
          last_position: data.currentTime,
          total_watched_seconds: totalWatchedSeconds,
          completed: completed || false,
          adult: isAdult,
          backdrop_path: backdropPath,
          poster_path: posterPath,
          release_date: releaseDate,
          title: titleStr,
          vote_average: voteAverage,
        },
        {
          onConflict: "user_id,media_id,type,season,episode",
        },
      )
      .select();

    if (error) {
      console.error("[history] save failed:", error.code ?? error.message);
      return {
        success: false,
        message: "Failed to save history",
      };
    }

    void history;

    return {
      success: true,
      message: "History saved",
    };
  } catch (error) {
    console.error("[history] unexpected error:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
    };
  }
};

/** Hard ceiling on any caller-supplied page size. */
const MAX_PAGE_SIZE = 100;

const boundedLimit = (limit: unknown, fallback = 20): number => {
  const value = Math.trunc(Number(limit));
  if (!Number.isFinite(value) || value < 1) return fallback;
  return Math.min(value, MAX_PAGE_SIZE);
};

/**
 * `limit` is a caller-supplied argument, not a constraint. Every exported function
 * in a "use server" module is a public HTTP endpoint, so the `= 20` default binds
 * only the app's own call sites — anyone with a session can invoke this directly
 * with `limit = 1_000_000` and force a full scan plus a huge serialized payload,
 * on repeat. Clamp it server-side.
 */
export const getUserHistories = async (limit: number = MAX_PAGE_SIZE): ActionResponse<HistoryDetail[]> => {
  const take = boundedLimit(limit);
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        message: "User not authenticated",
      };
    }

    const { data, error } = await supabase
      .from("histories")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(take);

    if (error) {
      console.info("History fetch error:", error);
      return {
        success: false,
        message: "Failed to fetch history",
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.info("Unexpected error:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
    };
  }
};

export const getMovieLastPosition = async (id: number): Promise<number> => {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return 0;
    }

    const { data, error } = await supabase
      .from("histories")
      .select("last_position")
      .eq("user_id", user.id)
      .eq("media_id", id)
      .eq("type", "movie");

    if (error) {
      console.info("History fetch error:", error);
      return 0;
    }

    return data?.[0]?.last_position || 0;
  } catch (error) {
    console.info("Unexpected error:", error);
    return 0;
  }
};

export const getTvShowLastPosition = async (
  id: number,
  season: number,
  episode: number,
): Promise<number> => {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return 0;
    }

    const { data, error } = await supabase
      .from("histories")
      .select("last_position")
      .eq("user_id", user.id)
      .eq("media_id", id)
      .eq("type", "tv")
      .eq("season", season)
      .eq("episode", episode);

    if (error) {
      console.info("History fetch error:", error);
      return 0;
    }

    return data?.[0]?.last_position || 0;
  } catch (error) {
    console.info("Unexpected error:", error);
    return 0;
  }
};

/** Removes a title from Continue Watching entirely — the row, and with it
 *  its accumulated watch time, is gone. */
export const deleteHistory = async (
  mediaId: number,
  type: ContentType,
  season = 0,
  episode = 0,
): ActionResponse => {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, message: "You must be logged in to remove history" };
    }

    const { error } = await supabase
      .from("histories")
      .delete()
      .eq("user_id", user.id)
      .eq("media_id", mediaId)
      .eq("type", type)
      .eq("season", season)
      .eq("episode", episode);

    if (error) {
      console.error("[history] delete failed:", error.code ?? error.message);
      return { success: false, message: "Failed to remove history" };
    }

    return { success: true, message: "Removed from Continue Watching" };
  } catch (error) {
    console.error("[history] unexpected error:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
};

/** Marks a title complete without deleting its row — it drops out of
 *  Continue Watching but stays in the full Watch History. */
export const markHistoryComplete = async (
  mediaId: number,
  type: ContentType,
  season = 0,
  episode = 0,
): ActionResponse => {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, message: "You must be logged in to update history" };
    }

    const { error } = await supabase
      .from("histories")
      .update({ completed: true })
      .eq("user_id", user.id)
      .eq("media_id", mediaId)
      .eq("type", type)
      .eq("season", season)
      .eq("episode", episode);

    if (error) {
      console.error("[history] complete failed:", error.code ?? error.message);
      return { success: false, message: "Failed to mark as complete" };
    }

    return { success: true, message: "Marked as complete" };
  } catch (error) {
    console.error("[history] unexpected error:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
};

export interface WatchTimeSummary {
  movie: number;
  tv: number;
  anime: number;
  total: number;
}

/** Per-type and grand-total watched seconds, from the accumulated ledger
 *  `syncHistory` maintains — not a sum of `last_position`, so rewatches
 *  count correctly. Row count per user is small; reduced client-side rather
 *  than via a SQL aggregate. */
export const getWatchTimeSummary = async (): ActionResponse<WatchTimeSummary> => {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, message: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("histories")
      .select("type, total_watched_seconds")
      .eq("user_id", user.id);

    if (error) {
      console.info("Watch time summary fetch error:", error);
      return { success: false, message: "Failed to fetch watch time" };
    }

    const summary = (data ?? []).reduce<WatchTimeSummary>(
      (acc, row) => {
        const seconds = row.total_watched_seconds ?? 0;
        if (row.type === "movie") acc.movie += seconds;
        else if (row.type === "tv") acc.tv += seconds;
        else if (row.type === "anime") acc.anime += seconds;
        acc.total += seconds;
        return acc;
      },
      { movie: 0, tv: 0, anime: 0, total: 0 },
    );

    return { success: true, data: summary };
  } catch (error) {
    console.info("Unexpected error:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
};
