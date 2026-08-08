"use client";

/**
 * `PHONE_SPEC.md` §G "03 — In the mood for" — the only fixed-height (not
 * aspect-ratio) tile in the app. The mock's tiles are poetic, illustrative
 * vibes ("Slow-burn revenge", "Cosy, low stakes") with counts that have no
 * queryable TMDB dimension behind them. These use the real genre list
 * `Categories.tsx` already exposes instead, each tile backed by its own
 * live `/discover` total rather than a made-up number.
 */

import Link from "next/link";
import { tmdbBrowser } from "@/api/tmdb-browser";
import { movieGenres } from "@/components/sections/Discover/Categories";
import { formatNumber } from "@/utils/helpers";
import { useQuery } from "@tanstack/react-query";
import SectionHeader from "./SectionHeader";

/** Action, Comedy, Horror, Science Fiction — four genres picked for
 *  contrast in mood rather than alphabetical order, so the rail doesn't
 *  read as four flavors of the same night in. TMDB genre ids, stable
 *  regardless of how `Categories.tsx` ever labels them. */
const VIBE_GENRE_IDS: readonly number[] = [28, 35, 27, 878];

const TILE_TINTS = [
  "from-violet-500/20 to-indigo-950/10",
  "from-amber-500/20 to-orange-950/10",
  "from-rose-500/20 to-red-950/10",
  "from-cyan-500/20 to-blue-950/10",
];

interface DiscoverCount {
  total_results: number;
}

function VibeTile({ id, name, tint }: { id: number; name: string; tint: string }) {
  const { data, isPending } = useQuery({
    queryKey: ["genre-count", id],
    queryFn: () => tmdbBrowser.discover.movie<DiscoverCount>({ with_genres: String(id), page: 1 }),
    staleTime: 60 * 60 * 1000,
  });

  return (
    <Link
      href={`/discover?type=discover&genres=${id}`}
      className={`flex h-[176px] w-[132px] flex-none flex-col justify-between rounded-[14px] border border-white/9 bg-linear-to-br p-[15px] ${tint} transition-colors duration-(--duration-fast) ease-(--ease-out-quint) hover:border-white/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70`}
    >
      <span className="font-mono text-[9.5px] tracking-[0.16em] text-white/42" aria-hidden={isPending || !data}>
        {isPending || !data ? "···" : `${formatNumber(data.total_results)} titles`}
      </span>
      <span className="font-serif text-[24px] leading-[1.02] tracking-[-0.01em]">{name}</span>
    </Link>
  );
}

export default function VibeTiles() {
  const tiles = movieGenres.filter(([id]) => VIBE_GENRE_IDS.includes(id));

  return (
    <div className="flex flex-col gap-[15px]">
      <SectionHeader number="03" label="In the mood for" />
      <div className="flex gap-[11px] overflow-x-auto px-5 pb-1">
        {tiles.map(([id, name], index) => (
          <VibeTile key={id} id={id} name={name} tint={TILE_TINTS[index % TILE_TINTS.length]} />
        ))}
      </div>
    </div>
  );
}
