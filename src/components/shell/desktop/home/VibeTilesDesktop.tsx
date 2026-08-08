"use client";

/**
 * Section 03, "In the mood for" (DESKTOP_SPEC.md §G). The mock's tiles are
 * fictional "vibes" ("Slow-burn revenge", "Found family"...) with no backing
 * filter — this build stands in real TMDB genres, reusing the same
 * `movieGenres` list Discover's Categories screen already uses, so the same
 * id lands on the same catalogue everywhere rather than inventing a second
 * taxonomy.
 */

import { movieGenres } from "@/components/sections/Discover/Categories";
import { tmdbBrowser } from "@/api/tmdb-browser";
import { useCustomCarousel } from "@/hooks/useCustomCarousel";
import { cn, formatNumber } from "@/utils/helpers";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import SectionHeader from "./SectionHeader";
import ShelfArrows from "./ShelfArrows";

interface DiscoverPage {
  total_results: number;
}

/** Five picked for tonal spread rather than every genre crammed into one
 *  rail — Action/Comedy/Drama/Horror/Science Fiction out of the shared
 *  12-genre list. */
const TILE_GENRES = [
  movieGenres[0], // Action
  movieGenres[3], // Comedy
  movieGenres[5], // Drama
  movieGenres[7], // Horror
  movieGenres[9], // Science Fiction
] as const;

/** Low-opacity per-tile tints standing in for the mock's per-vibe gradient —
 *  the mock has no equivalent palette for real genres, so this is a styling
 *  choice, not data. */
const TINTS = [
  "linear-gradient(155deg,rgba(196,181,253,.16) 0%,rgba(255,255,255,.02) 100%)",
  "linear-gradient(155deg,rgba(125,211,252,.14) 0%,rgba(255,255,255,.02) 100%)",
  "linear-gradient(155deg,rgba(253,164,175,.14) 0%,rgba(255,255,255,.02) 100%)",
  "linear-gradient(155deg,rgba(252,211,77,.12) 0%,rgba(255,255,255,.02) 100%)",
  "linear-gradient(155deg,rgba(167,139,250,.16) 0%,rgba(255,255,255,.02) 100%)",
];

function GenreTile({ id, name, tint }: { id: number; name: string; tint: string }) {
  const { data, isPending } = useQuery({
    queryKey: ["genre-count", id],
    queryFn: () => tmdbBrowser.discover.movie<DiscoverPage>({ with_genres: String(id) }),
    staleTime: 60 * 60 * 1000,
  });

  return (
    <Link
      href={`/discover?type=discover&genres=${id}`}
      prefetch={false}
      style={{ backgroundImage: tint }}
      className={cn(
        "group flex h-[150px] w-[220px] flex-none flex-col justify-between rounded-[15px] border border-white/9 p-[18px]",
        "transition-transform duration-200 ease-(--ease-out-quint) will-change-transform",
        "hover:-translate-y-1.5 focus-visible:-translate-y-1.5",
        "focus:outline-hidden focus-visible:ring-2 focus-visible:ring-white/70",
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
      )}
    >
      <span className="font-mono text-[10px] tracking-[.14em] text-white/42">
        {isPending || !data ? "—" : formatNumber(data.total_results, { uppercase: true })} TITLES
      </span>
      <span className="font-serif text-[28px] leading-[1.02] text-white">{name}</span>
    </Link>
  );
}

export default function VibeTilesDesktop() {
  const { emblaRef, scrollPrev, scrollNext, canScrollPrev, canScrollNext } = useCustomCarousel({
    align: "start",
    slidesToScroll: "auto",
    containScroll: "trimSnaps",
  });

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader number="03" label="In the mood for" />
      <div className="relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-3.5 px-12 pb-1.5">
            {TILE_GENRES.map(([id, name], i) => (
              <GenreTile key={id} id={id} name={name} tint={TINTS[i % TINTS.length]} />
            ))}
          </div>
        </div>
        <ShelfArrows
          canScrollPrev={canScrollPrev}
          canScrollNext={canScrollNext}
          onPrev={scrollPrev}
          onNext={scrollNext}
          label="In the mood for"
        />
      </div>
    </section>
  );
}
