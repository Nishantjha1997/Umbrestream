"use client";

/**
 * `PHONE_SPEC.md` §G "02 — Tonight" — the one full-bleed section, zero side
 * padding. Reads `getPersonalizedRecommendations()` off the same query key
 * `Recommended.tsx` and `useHomeHero` already populate, and skips whatever
 * `useHomeHero` promoted to the resume hero above it so the same title never
 * appears twice in a row.
 *
 * The mock hardcodes a specific claim ("Because you finished Arrival, and
 * rated it 5") the recommendation engine has no way to back up for a real
 * account — it returns a ranked list, not a per-item justification — so the
 * reason line here is honest, generic copy instead. The mock's "1 / 4"
 * counter is dropped for the same reason: there is exactly one real
 * candidate, not four (`SONNET_IMPLEMENTATION_PLAN.md` §12 trap 5).
 *
 * The mock's Play/Add controls are plain non-interactive `<span>`s (trap 1:
 * "the mockups contain inert controls... every one needs real behavior").
 * Both are wired for real here: Play deep-links to the player (or the
 * episode list for a show, mirroring `Hero.tsx`'s own movie/tv split), and
 * Add calls the watchlist actions that already back `BookmarkButton.tsx`
 * elsewhere in the app.
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import { addToast } from "@heroui/react";
import { addToWatchlist, removeFromWatchlist } from "@/actions/library";
import { getPersonalizedRecommendationFeed } from "@/actions/recommendations";
import { useHomeHero } from "@/hooks/useHomeHero";
import useSupabaseUser from "@/hooks/useSupabaseUser";
import type { MediaSummary } from "@/types/media";
import { Check } from "@/utils/icons";
import { fromAnime, fromMovie, fromTvShow } from "@/utils/normalize-media";
import { useQuery } from "@tanstack/react-query";
import type { Movie, TV } from "tmdb-ts/dist/types";
import SectionHeader from "./SectionHeader";

/** Mirrors `Hero.tsx`'s movie/tv/anime split — a show has no one thing to
 *  "play" without an episode, so it opens the episode list instead. */
function playHrefFor(media: MediaSummary): string {
  if (media.kind === "movie") return `/movie/${media.id}/player`;
  if (media.kind === "anime") return `/anime/${media.id}/player/1`;
  return `/tv/${media.id}#seasons-episodes`;
}

function playLabelFor(media: MediaSummary): string {
  return media.kind === "tv" ? "View Episodes" : "Play";
}

function TonightSkeleton() {
  return (
    <div className="flex flex-col gap-[15px]" aria-hidden="true">
      <SectionHeader number="02" label="Tonight" />
      <div className="aspect-3/4 w-full animate-pulse rounded-[13px] bg-white/8" />
    </div>
  );
}

export default function Tonight() {
  const { data: user, isLoading: isUserLoading } = useSupabaseUser();
  const { pick: heroPick } = useHomeHero();

  const { data: recommendations, isLoading: isRecsLoading } = useQuery({
    queryKey: ["personalized-recommendations", user?.id],
    queryFn: () => getPersonalizedRecommendationFeed(),
    enabled: !isUserLoading,
    staleTime: 30 * 60 * 1000,
  });

  const media = useMemo<MediaSummary | undefined>(() => {
    for (const item of recommendations?.items ?? []) {
      const candidate =
        item.type === "movie"
          ? fromMovie(item.media as Movie)
          : item.type === "tv"
            ? fromTvShow(item.media as TV)
            : fromAnime(item.media);

      // Never show the same title the resume hero already promoted.
      if (
        heroPick &&
        heroPick.media.kind === candidate.kind &&
        heroPick.media.id === candidate.id
      ) {
        continue;
      }
      return candidate;
    }
    return undefined;
  }, [recommendations?.items, heroPick]);

  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  if (isUserLoading || isRecsLoading) return <TonightSkeleton />;

  if (!media) return null;

  const handleSave = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (pending) return;
    if (!user) {
      addToast({ title: "Sign in to save titles to your watchlist", color: "warning" });
      return;
    }

    setPending(true);
    try {
      if (saved) {
        const result = await removeFromWatchlist(media.id, media.kind);
        if (result.success) {
          setSaved(false);
          addToast({ title: `Removed ${media.title} from your watchlist` });
        } else {
          addToast({
            title: "Couldn't update your watchlist",
            description: result.error,
            color: "danger",
          });
        }
      } else {
        const result = await addToWatchlist({
          id: media.id,
          type: media.kind,
          adult: media.isAdult,
          backdrop_path: media.backdropUrl ?? media.posterUrl,
          poster_path: media.posterUrl,
          release_date: media.year ? `${media.year}-01-01` : new Date().toISOString().slice(0, 10),
          title: media.title,
          vote_average: media.rating ?? 0,
        });
        if (result.success || result.error === "This item is already in your watchlist") {
          setSaved(true);
          addToast({ title: `Added ${media.title} to your watchlist`, color: "success" });
        } else {
          addToast({
            title: "Couldn't update your watchlist",
            description: result.error,
            color: "danger",
          });
        }
      }
    } finally {
      setPending(false);
    }
  };

  const metaParts: string[] = [];
  if (media.year !== undefined) metaParts.push(String(media.year));
  if (media.rating !== undefined && media.rating > 0) metaParts.push(`★ ${media.rating.toFixed(1)}`);

  return (
    <div className="flex flex-col gap-[15px]">
      <SectionHeader number="02" label="Tonight" />
      <div className="relative aspect-3/4 w-full overflow-hidden">
        <Link
          href={media.href}
          aria-label={media.title}
          className="absolute inset-0 z-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={media.posterUrl}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full object-cover"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#0a090d] from-3% via-[rgba(10,9,13,.62)] via-34% to-[rgba(10,9,13,.02)] to-78%"
          />
        </Link>

        <div className="pointer-events-none absolute inset-x-5 bottom-[22px] z-10 flex flex-col gap-[13px]">
          <p className="m-0 text-[11px] leading-[1.5] text-accent">Picked for tonight</p>
          <h3 className="m-0 font-serif text-[46px] leading-[0.9] tracking-[-0.025em] text-balance">
            {media.title}
          </h3>
          {metaParts.length > 0 && (
            <p className="m-0 text-[12px] tracking-[0.02em] text-white/55">{metaParts.join(" · ")}</p>
          )}

          <div className="pointer-events-auto flex items-center gap-[10px] pt-1">
            <Link
              href={playHrefFor(media)}
              className="flex h-[42px] items-center gap-2 rounded-full bg-white px-[22px] text-[13.5px] font-semibold text-[#0a090d] transition-opacity duration-(--duration-fast) ease-(--ease-out-quint) hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <svg width="11" height="12" viewBox="0 0 12 14" aria-hidden="true">
                <path d="M1 1.4v11.2L11 7 1 1.4Z" fill="#0a090d" />
              </svg>
              {playLabelFor(media)}
            </Link>
            <button
              type="button"
              onClick={handleSave}
              disabled={pending}
              aria-pressed={saved}
              aria-label={
                saved ? `Remove ${media.title} from your watchlist` : `Add ${media.title} to your watchlist`
              }
              className="glass-control flex size-[42px] items-center justify-center rounded-full border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:opacity-60"
            >
              {saved ? (
                <Check size={14} aria-hidden="true" />
              ) : (
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M10 4v12M4 10h12" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
