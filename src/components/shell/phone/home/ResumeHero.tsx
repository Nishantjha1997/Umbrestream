"use client";

/**
 * The unnumbered "resume hero" at the top of phone Home (`PHONE_SPEC.md`
 * §C.1). One content slot, one decision — `useHomeHero` already resolved
 * continue-watching vs. personalized-recommendation vs. trending, in that
 * priority, so this component only renders whatever it picked and never
 * re-derives the choice itself.
 *
 * The ring row is driven by nullish fallbacks rather than three branches:
 * a resume pick always carries `episodeLabel`/`remainingLabel` for tv/anime
 * (movies get `remainingLabel` only) and a real `progressPercent`; a
 * recommended/trending pick carries none of those, so the ring disappears
 * and the caption falls back to year/rating — never a fabricated "time
 * left" for a title nobody has started.
 */

import Link from "next/link";
import EclipseRing from "@/components/media/EclipseRing";
import HomeEmptyState from "@/components/sections/Home/EmptyState";
import HistoryItemActions from "@/components/ui/button/HistoryItemActions";
import { useHomeHero, type HomeHeroPick } from "@/hooks/useHomeHero";

const KIND_LABEL: Record<HomeHeroPick["media"]["kind"], string> = {
  movie: "Movie",
  tv: "Series",
  anime: "Anime",
};

function metaCaption(pick: HomeHeroPick): string {
  const { media } = pick;
  const parts: string[] = [];
  if (media.year !== undefined) parts.push(String(media.year));
  if (media.rating !== undefined && media.rating > 0) parts.push(media.rating.toFixed(1));
  return parts.length > 0 ? parts.join(" · ") : KIND_LABEL[media.kind];
}

function HeroSkeleton() {
  return (
    <div className="flex items-end gap-[18px] px-5 pt-3" aria-hidden="true">
      <div className="aspect-2/3 w-[146px] flex-none animate-pulse rounded-[13px] bg-white/8" />
      <div className="flex min-w-0 flex-1 flex-col gap-[13px] pb-0.5">
        <div className="size-[50px] flex-none animate-pulse rounded-full bg-white/8" />
        <div className="h-9 w-4/5 animate-pulse rounded-md bg-white/8" />
        <div className="h-[42px] w-full animate-pulse rounded-full bg-white/8" />
      </div>
    </div>
  );
}

export default function ResumeHero() {
  const { pick, isLoading, isSignedOut } = useHomeHero();

  if (isLoading) return <HeroSkeleton />;

  if (!pick) {
    return (
      <div className="px-5">
        <HomeEmptyState
          title="Continue Watching"
          headline={isSignedOut ? "Pick up where you left off" : "Nothing in progress"}
          description={
            isSignedOut
              ? "Sign in and StreamFree keeps your place in everything you watch, on every device."
              : "Start a title and it reappears here at the exact second you stopped."
          }
          action={
            isSignedOut
              ? { label: "Sign in", href: "/auth" }
              : { label: "Browse titles", href: "/discover" }
          }
        />
      </div>
    );
  }

  const isResume = pick.source === "resume";
  const topLine = pick.episodeLabel ?? metaCaption(pick);
  const bottomLine = pick.remainingLabel ?? "New for you";
  const pctLabel = `${Math.round(pick.progressPercent ?? 0)}%`;

  return (
    <div className="flex items-end gap-[18px] px-5 pt-3">
      <Link
        href={pick.media.href}
        aria-label={pick.media.title}
        className="group relative block w-[146px] flex-none rounded-[13px] focus-visible:outline-none"
      >
        {/* Decorative bloom: the crisp plate below carries the real art. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={pick.media.posterUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-x-2 top-[22px] -bottom-3.5 rounded-[18px] object-cover opacity-90 blur-[30px]"
        />
        <div className="relative z-10 aspect-2/3 w-[146px] overflow-hidden rounded-[13px] shadow-[0_28px_62px_-20px_rgba(0,0,0,.98),0_0_0_1px_rgba(255,255,255,.11)] transition-transform duration-(--duration-base) ease-(--ease-out-quint) group-focus-visible:scale-[1.02] motion-reduce:transition-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pick.media.posterUrl}
            alt=""
            aria-hidden="true"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 size-full object-cover"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/42 to-transparent to-[58%]"
          />
        </div>
        {isResume && (
          <HistoryItemActions
            mediaId={pick.media.id}
            type={pick.media.kind}
            season={pick.season}
            episode={pick.episode}
            title={pick.media.title}
            className="absolute top-2 right-2 z-20 flex gap-1"
          />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-[13px] pb-0.5">
        <div className="flex items-center gap-[11px]">
          {isResume && (
            <EclipseRing
              size={50}
              percent={pick.progressPercent ?? 0}
              label={<span className="text-[10.5px] font-semibold tracking-[-0.03em]">{pctLabel}</span>}
            />
          )}
          <div className="flex min-w-0 flex-col gap-px">
            <p className="m-0 truncate text-[11px] text-white/50">{topLine}</p>
            <p className="m-0 truncate text-[12.5px] font-medium text-white/90">{bottomLine}</p>
          </div>
        </div>

        <h1 className="m-0 font-serif text-[38px] leading-[0.94] tracking-[-0.015em] text-balance">
          {pick.media.title}
        </h1>

        <Link
          href={pick.playHref}
          className="flex h-[42px] w-full items-center justify-center gap-2 rounded-full bg-white text-[13.5px] font-semibold text-[#0a090d] transition-opacity duration-(--duration-fast) ease-(--ease-out-quint) hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 motion-reduce:transition-none"
        >
          <svg width="11" height="12" viewBox="0 0 12 14" aria-hidden="true">
            <path d="M1 1.4v11.2L11 7 1 1.4Z" fill="#0a090d" />
          </svg>
          {isResume ? "Resume" : "Play"}
        </Link>
      </div>
    </div>
  );
}
