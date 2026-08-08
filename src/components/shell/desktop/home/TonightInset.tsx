"use client";

/**
 * Section 02, "Tonight" (DESKTOP_SPEC.md §G) — an editorial billboard, not a
 * shelf, and desktop's rotation-equivalent for the hero above (§F, §J: the
 * hero itself never rotates). Reuses the same personalized-recommendations
 * row `Recommended.tsx`/`useHomeHero` already fetch (shared query key, cache
 * hit) and skips whichever title `useHomeHero` already promoted to the hero,
 * so the same title never appears twice on one page load.
 */

import { getPersonalizedRecommendations } from "@/actions/recommendations";
import { useHomeHero } from "@/hooks/useHomeHero";
import useSupabaseUser from "@/hooks/useSupabaseUser";
import type { MediaSummary } from "@/types/media";
import { cn } from "@/utils/helpers";
import { PlayFilled } from "@/utils/icons";
import { fromAnime, fromMovie, fromTvShow } from "@/utils/normalize-media";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo } from "react";
import SectionHeader from "./SectionHeader";

export default function TonightInset() {
  const { data: user, isLoading: isUserLoading } = useSupabaseUser();
  const { pick: heroPick } = useHomeHero();

  const { data: recommendations } = useQuery({
    queryKey: ["personalized-recommendations", user?.id],
    queryFn: () => getPersonalizedRecommendations(),
    enabled: !isUserLoading,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const pick = useMemo<MediaSummary | undefined>(() => {
    for (const item of recommendations ?? []) {
      const media =
        item.type === "movie"
          ? fromMovie(item.media)
          : item.type === "tv"
            ? fromTvShow(item.media)
            : fromAnime(item.media);
      // Never the same title the hero above is already showing.
      if (heroPick && media.kind === heroPick.media.kind && media.id === heroPick.media.id) {
        continue;
      }
      return media;
    }
    return undefined;
  }, [recommendations, heroPick]);

  if (!pick) return null;

  const meta = [pick.year, pick.rating && pick.rating > 0 ? pick.rating.toFixed(1) : undefined]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader number="02" label="Tonight" />
      <Link
        href={pick.href}
        prefetch={false}
        className={cn(
          "group relative mx-12 block aspect-21/8 overflow-hidden rounded-[18px]",
          "focus:outline-hidden focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        )}
      >
        {/* Decorative: the title renders as real text below. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={pick.backdropUrl ?? pick.posterUrl}
          alt=""
          aria-hidden="true"
          draggable={false}
          loading="lazy"
          decoding="async"
          className={cn(
            "absolute inset-0 size-full object-cover object-center",
            "transition-transform duration-(--duration-slow) ease-(--ease-out-quint)",
            "group-hover:scale-[1.01] group-focus-visible:scale-[1.01]",
            "motion-reduce:transition-none motion-reduce:group-hover:scale-100",
          )}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: "linear-gradient(90deg,rgba(10,9,13,.92),rgba(10,9,13,.2) 62%)" }}
        />

        <div className="absolute inset-y-0 left-10 flex max-w-[440px] flex-col justify-center gap-3">
          {/* Honest and generic on purpose — there is no per-title "why this"
              signal to report, so nothing specific is invented. */}
          <p className="text-[11.5px] text-accent">Picked for tonight</p>
          <h3 className="font-serif text-[44px] leading-[.94] tracking-[-.02em] text-white">
            {pick.title}
          </h3>
          {meta && <p className="text-[12px] text-white/55">{meta}</p>}
          <span className="mt-1.5 flex h-10 w-fit items-center gap-2 rounded-full bg-white px-5 text-[13px] font-semibold text-[#0a090d]">
            <PlayFilled size={11} aria-hidden="true" />
            Play
          </span>
        </div>
      </Link>
    </section>
  );
}
