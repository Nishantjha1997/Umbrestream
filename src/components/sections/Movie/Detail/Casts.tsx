"use client";

/**
 * The movie detail page's cast shelf.
 *
 * The implementation is shared with the TV detail page — both consume TMDB's
 * `credits.cast` and there was never anything movie-specific about it, so the
 * portrait rail lives once in @/components/ui/other/CastRail and this file
 * stays only because `src/app/movie/[id]/page.tsx` imports it by path.
 */
export { default } from "@/components/ui/other/CastRail";
