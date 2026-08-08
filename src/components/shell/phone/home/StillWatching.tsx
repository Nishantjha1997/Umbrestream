"use client";

/**
 * `PHONE_SPEC.md` §G "01 — Still watching" — the narrow ringed rail right
 * below the resume hero. Reads the same `["continue-watching", user?.id]`
 * query `ResumeHero` (via `useHomeHero`) already populates, so this never
 * issues a second network request. Filters out completed titles, then
 * slices off index 0 — the hero above already promoted whichever
 * non-completed entry comes first.
 *
 * Tapping a card resumes playback directly. `HistoryItemActions` lets a
 * viewer remove a title or mark it complete without leaving the rail.
 */

import Link from "next/link";
import { getUserHistories } from "@/actions/histories";
import EclipseRing from "@/components/media/EclipseRing";
import HistoryItemActions from "@/components/ui/button/HistoryItemActions";
import useSupabaseUser from "@/hooks/useSupabaseUser";
import type { HistoryDetail } from "@/types/movie";
import type { MediaKind } from "@/types/media";
import { formatTimeLeft, getImageUrl } from "@/utils/movies";
import { useQuery } from "@tanstack/react-query";
import SectionHeader from "./SectionHeader";

function playHrefFor(item: HistoryDetail): string {
  const kind = item.type as MediaKind;
  if (kind === "movie") return `/movie/${item.media_id}/player`;
  if (kind === "tv") return `/tv/${item.media_id}/${item.season}/${item.episode}/player`;
  return `/anime/${item.media_id}/player/${item.episode}`;
}

export default function StillWatching() {
  const { data: user, isLoading: isUserLoading } = useSupabaseUser();

  const { data } = useQuery({
    queryKey: ["continue-watching", user?.id],
    queryFn: () => getUserHistories(),
    enabled: !isUserLoading,
  });

  // Completed titles aren't "still watching" — filtered before the slice so
  // it always skips whichever entry the hero above is showing, not just
  // positional index 0 (`useHomeHero` applies the same filter).
  const active = (data?.success ? data.data ?? [] : []).filter((h) => !h.completed);
  const rest = active.slice(1);

  if (rest.length === 0) return null;

  return (
    <div className="flex flex-col gap-[15px]">
      <SectionHeader number="01" label="Still watching" />
      <div className="flex gap-[13px] overflow-x-auto px-5 pb-1">
        {rest.map((item) => {
          const percent =
            item.duration > 0 ? Math.min(100, (item.last_position / item.duration) * 100) : 0;

          return (
            <Link
              key={`${item.type}-${item.media_id}-${item.season}-${item.episode}`}
              href={playHrefFor(item)}
              className="group flex w-[94px] flex-none flex-col gap-[9px] rounded-[10px] focus-visible:outline-none"
            >
              <div className="relative aspect-2/3 w-[94px] overflow-hidden rounded-[10px] shadow-[0_12px_28px_-14px_rgba(0,0,0,.9)] ring-1 ring-white/0 transition-shadow group-focus-visible:ring-2 group-focus-visible:ring-white/70">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getImageUrl(item.poster_path || item.backdrop_path || "", "poster")}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 size-full object-cover"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/55 to-transparent to-[60%]"
                />
                <EclipseRing
                  size={26}
                  percent={percent}
                  withBacking
                  className="absolute right-[6px] bottom-[6px]"
                />
                <HistoryItemActions
                  mediaId={item.media_id}
                  type={item.type as MediaKind}
                  season={item.season}
                  episode={item.episode}
                  title={item.title}
                  className="absolute top-1 right-1 flex gap-1"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="m-0 line-clamp-2 text-[11.5px] leading-[1.25] font-medium text-white">
                  {item.title}
                </p>
                <p className="m-0 text-[10px] text-white/38">
                  {formatTimeLeft(item.last_position, item.duration)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
