"use server";

import { tmdb } from "@/api/tmdb";
import { anilistApi } from "@/api/anilist";
import { UnifiedPlayerEventData } from "@/hooks/usePlayerEvents";
import { ActionResponse } from "@/types";
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

    // Insert or update history
    const { data: history, error } = await supabase
      .from("histories")
      .upsert(
        {
          user_id: user.id,
          media_id: Number(data.mediaId),
          type: data.mediaType,
          season: data.season || 0,
          episode: data.episode || 0,
          duration: data.duration,
          last_position: data.currentTime,
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
export const getUserHistories = async (limit: number = 20): ActionResponse<HistoryDetail[]> => {
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
