"use server";

import { tmdb } from "@/api/tmdb";
import { ActionResponse } from "@/types";
import { isEmpty } from "@/utils/helpers";
import { callerKey, rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

/**
 * Longest query worth forwarding. TMDB does nothing useful with more, and an
 * unbounded string is free upstream payload for a caller who is only here to
 * generate load.
 */
const MAX_QUERY_LENGTH = 100;

/**
 * This is a public, unauthenticated server action that spends the *server's* TMDB
 * token: two upstream calls per invocation, and because it uses `@/api/tmdb`
 * directly it bypasses the 60/min limiter on the /api/tmdb proxy entirely. An
 * anonymous loop therefore drives the project's TMDB quota to 429 and takes
 * browse, search and detail pages down with it. The client-side debounce is a UX
 * affordance, not a control.
 *
 * Per-instance limiting only — see src/lib/rate-limit.ts for why that ceiling
 * matters and what replaces it.
 */
const SUGGEST_LIMIT = 30;
const SUGGEST_WINDOW_MS = 60_000;

export type SearchSuggestion = {
  id: number;
  title: string;
  type: "movie" | "tv";
};

export const getSearchSuggestions = async (
  query: string,
  limit: number = 10,
): Promise<ActionResponse<SearchSuggestion[] | null>> => {
  try {
    if (isEmpty(query)) {
      return {
        success: true,
        message: "No search suggestions",
        data: null,
      };
    }

    if (query.length > MAX_QUERY_LENGTH) {
      return {
        success: true,
        message: "No search suggestions",
        data: null,
      };
    }

    const limiter = rateLimit(
      "search-suggestions",
      callerKey(await headers()),
      SUGGEST_LIMIT,
      SUGGEST_WINDOW_MS,
    );
    if (!limiter.allowed) {
      return {
        success: false,
        message: "Too many searches. Try again in a moment.",
        data: null,
      };
    }

    const [movies, tvShows] = await Promise.all([
      tmdb.search.movies({ query, page: 1 }),
      tmdb.search.tvShows({ query, page: 1 }),
    ]);

    const movieSuggestions: SearchSuggestion[] = movies.results.map((movie) => ({
      id: movie.id,
      title: movie.title,
      type: "movie",
    }));
    const tvSuggestions: SearchSuggestion[] = tvShows.results.map((tv) => ({
      id: tv.id,
      title: tv.name,
      type: "tv",
    }));

    const suggestions = [...movieSuggestions, ...tvSuggestions];

    if (isEmpty(suggestions)) {
      return {
        success: true,
        message: "No search suggestions",
        data: null,
      };
    }

    const filteredSuggestions = suggestions
      .filter((data) => data.title.toLowerCase().includes(query.toLowerCase()))
      .filter(
        (data, index, self) =>
          index === self.findIndex((t) => t.title.toLowerCase() === data.title.toLowerCase()),
      );

    const sortedSuggestions = filteredSuggestions.sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      const queryLower = query.toLowerCase();

      const aStartsWith = aTitle.startsWith(queryLower);
      const bStartsWith = bTitle.startsWith(queryLower);

      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;

      const aIndex = aTitle.indexOf(queryLower);
      const bIndex = bTitle.indexOf(queryLower);

      if (aIndex !== bIndex) return aIndex - bIndex;
      return aTitle.localeCompare(bTitle);
    });

    return {
      success: true,
      message: "Search suggestions fetched",
      data: sortedSuggestions.slice(0, limit),
    };
  } catch (error) {
    console.error("Search suggestions error:", error);

    return {
      success: false,
      message: "Error fetching search suggestions",
      data: null,
    };
  }
};
