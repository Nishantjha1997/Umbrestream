"use client";

import { anilistApi } from "@/api/anilist";
import { getBrowserRegion, getRegionOverride, type GeoRegion } from "@/api/geo-browser";
import { tmdbBrowser } from "@/api/tmdb-browser";
import MediaRow from "@/components/media/MediaRow";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Movie, TV } from "tmdb-ts/dist/types";

interface PagedResult<T> {
  page: number;
  results: T[];
  total_results: number;
  total_pages: number;
}

function regionParams(region: GeoRegion) {
  return {
    region: region.country,
    watch_region: region.country,
    sort_by: "popularity.desc",
    with_watch_monetization_types: "flatrate|free|ads|rent|buy",
  };
}

export default function RegionalDiscoveryRows({ idPrefix }: { idPrefix: "phone" | "desktop" }) {
  const [override, setOverride] = useState<string | null>(null);
  useEffect(() => {
    setOverride(getRegionOverride());
    const onRegionChange = () => setOverride(getRegionOverride());
    window.addEventListener("streamfree-region-change", onRegionChange);
    return () => window.removeEventListener("streamfree-region-change", onRegionChange);
  }, []);

  const { data: region } = useQuery({
    queryKey: ["browser-region", override ?? "automatic"],
    queryFn: getBrowserRegion,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (!region) return null;

  const params = regionParams(region);
  const countryLabel = region.country === "US" && region.source === "default" ? "Global" : region.countryName;

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      <MediaRow
        idPrefix={idPrefix}
        kind="movie"
        name={`${countryLabel} trending movies`}
        param="regionalMovies"
        priority
        query={() => tmdbBrowser.discover.movie<PagedResult<Movie>>(params)}
      />
      <MediaRow
        idPrefix={idPrefix}
        kind="tv"
        name={`${countryLabel} trending series`}
        param="regionalSeries"
        query={() => tmdbBrowser.discover.tv<PagedResult<TV>>(params)}
      />
      <MediaRow
        idPrefix={idPrefix}
        kind="anime"
        name="Trending anime"
        param="animeTrending"
        query={() => anilistApi.trending()}
      />
    </div>
  );
}
