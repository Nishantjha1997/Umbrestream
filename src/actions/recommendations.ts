"use server";

import { createClient } from "@/utils/supabase/server";
import { getUserHistories } from "./histories";
import { tmdbBrowser } from "@/api/tmdb-browser";
import { anilistApi } from "@/api/anilist";
import { ContentType } from "@/types";

export type RecommendedItem =
  | { type: "movie"; media: any }
  | { type: "tv"; media: any }
  | { type: "anime"; media: any };

export async function getPersonalizedRecommendations(): Promise<RecommendedItem[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return await getFallbackTrending();
    }

    // Fetch user's watch history
    const historyRes = await getUserHistories(10);
    if (!historyRes.success || !historyRes.data || historyRes.data.length === 0) {
      return await getFallbackTrending();
    }

    // Get up to 3 unique seed items from history
    const historyItems = historyRes.data;
    const watchedIds = new Set(historyItems.map((item) => `${item.type}-${item.media_id}`));

    const seeds = historyItems
      .filter((item, index, self) =>
        self.findIndex((t) => t.media_id === item.media_id && t.type === item.type) === index
      )
      .slice(0, 3);

    // Fetch recommendations for seeds in parallel
    const recommendationPromises = seeds.map(async (seed) => {
      try {
        if (seed.type === "movie") {
          const res = await tmdbBrowser.movies.recommendations(seed.media_id);
          return (res.results || []).map((m: any) => ({ type: "movie" as const, media: m }));
        } else if (seed.type === "tv") {
          const res = await tmdbBrowser.tvShows.recommendations(seed.media_id);
          return (res.results || []).map((t: any) => ({ type: "tv" as const, media: t }));
        } else if (seed.type === "anime") {
          const res = await anilistApi.details(seed.media_id);
          return (res?.recommendations || []).map((a: any) => ({ type: "anime" as const, media: a }));
        }
      } catch (err) {
        console.error(`Failed to fetch recommendations for seed ${seed.type}-${seed.media_id}:`, err);
      }
      return [];
    });

    const recommendationResults = await Promise.all(recommendationPromises);
    const blended = recommendationResults.flat();

    // Deduplicate and filter out already watched items
    const seen = new Set<string>();
    const filtered: RecommendedItem[] = [];

    for (const item of blended) {
      if (!item.media || !item.media.id) continue;
      const key = `${item.type}-${item.media.id}`;
      if (!seen.has(key) && !watchedIds.has(key)) {
        seen.add(key);
        filtered.push(item);
      }
    }

    // If we don't have enough recommendations, blend in trending items
    if (filtered.length < 5) {
      const fallback = await getFallbackTrending();
      for (const item of fallback) {
        const key = `${item.type}-${item.media.id}`;
        if (!seen.has(key) && !watchedIds.has(key)) {
          seen.add(key);
          filtered.push(item);
        }
      }
    }

    // Limit to top 15 recommendations
    return filtered.slice(0, 15);
  } catch (error) {
    console.error("Failed to build recommendations:", error);
    return await getFallbackTrending();
  }
}

async function getFallbackTrending(): Promise<RecommendedItem[]> {
  try {
    const [moviesRes, tvsRes, animeRes] = await Promise.all([
      tmdbBrowser.trending.trending<any>("movie", "day").catch(() => ({ results: [] })),
      tmdbBrowser.trending.trending<any>("tv", "day").catch(() => ({ results: [] })),
      anilistApi.trending().catch(() => ({ media: [] })),
    ]);

    const blended: RecommendedItem[] = [];
    const movieItems = (moviesRes?.results || []).slice(0, 5);
    const tvItems = (tvsRes?.results || []).slice(0, 5);
    const animeItems = (animeRes?.media || []).slice(0, 5);

    const maxLength = Math.max(movieItems.length, tvItems.length, animeItems.length);
    for (let i = 0; i < maxLength; i++) {
      if (i < movieItems.length) blended.push({ type: "movie", media: movieItems[i] });
      if (i < tvItems.length) blended.push({ type: "tv", media: tvItems[i] });
      if (i < animeItems.length) blended.push({ type: "anime", media: animeItems[i] });
    }

    return blended;
  } catch (error) {
    console.error("Failed to fetch fallback trending items:", error);
    return [];
  }
}
