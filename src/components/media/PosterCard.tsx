"use client";

import HoverPreview from "@/components/media/HoverPreview";
import VaulDrawer from "@/components/ui/overlay/VaulDrawer";
import useBreakpoints from "@/hooks/useBreakpoints";
import useDeviceVibration from "@/hooks/useDeviceVibration";
import type { MediaSummary } from "@/types/media";
import { cn } from "@/utils/helpers";
import { PlayFilled, Star } from "@/utils/icons";
import { Tooltip } from "@heroui/react";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import { useCallback } from "react";
import { useLongPress } from "use-long-press";

/**
 * The one poster card.
 *
 * Replaces the six near-identical files under
 * {Movie,TV,Anime}/Cards/{Poster,Hover}.tsx. It consumes MediaSummary only and
 * never branches on TMDB vs AniList field names — that is the normalizer's job
 * (@/utils/normalize-media).
 *
 * What changed from those six, and why (§2.2 / §11):
 *
 * - The 3px chromatic hover border is gone. `hover:border-primary` /
 *   `-warning` / `-secondary` used hue as media-type taxonomy and was the most
 *   dated element in the UI. Depth now comes from scale + elevation + a
 *   low-opacity light ring.
 * - Metadata sits *below* the poster instead of being burned into a permanent
 *   bottom gradient. This is the single largest Apple-TV-vs-previous
 *   difference; posters are art and stay clean.
 * - The image zoom dropped from scale-110 to scale-[1.06] and lost its
 *   simultaneous opacity-70 — a 30% opacity drop plus a 10% zoom read as muddy.
 * - The play affordance is a static icon in a glass-control circle that fades
 *   in. It used to be a conditionally *mounted* 64px self-animating `line-md`
 *   icon, so it hard-popped and replayed its draw on every single hover.
 * - There is now a focus-visible state at least as strong as hover. There was
 *   previously none at all, which made the browse grid unusable by keyboard.
 */

export interface PosterCardProps {
  media: MediaSummary;
  /** `rail` sits in a <Shelf>; `grid` sits in a `movie-grid` (Discover, Search, Library). */
  variant?: "rail" | "grid";
  /** Skip lazy-loading for above-the-fold art. */
  priority?: boolean;
  /** Position in its row. Drives the staggered reveal; omit outside a shelf. */
  index?: number;
}

const STAGGER_MS = 45;
/** Cap the stagger so a 20-card row doesn't take two seconds to finish. */
const STAGGER_CAP = 8;

const KIND_LABEL: Record<MediaSummary["kind"], string> = {
  movie: "Movie",
  tv: "TV",
  anime: "Anime",
};

const PosterCard: React.FC<PosterCardProps> = ({ media, variant = "rail", priority, index }) => {
  const { mobile } = useBreakpoints();
  const [opened, handlers] = useDisclosure(false);
  const { startVibration } = useDeviceVibration();

  const openPreview = useCallback(() => {
    // §11.5: the haptic used to fire on a setTimeout(300) *after* a 300ms
    // long-press, so it landed ~600ms in — well after the drawer was already
    // sliding. Firing it first makes it lead the visual, which is what a
    // long-press confirmation is for.
    startVibration([12]);
    handlers.open();
  }, [handlers, startVibration]);

  const longPress = useLongPress(mobile ? openPreview : null, {
    cancelOnMovement: true,
    threshold: 300,
  });

  const rating = media.rating && media.rating > 0 ? media.rating : undefined;
  const badge = media.format ?? (variant === "grid" ? KIND_LABEL[media.kind] : undefined);

  const card = (
    <Link
      href={media.href}
      prefetch={false}
      aria-label={media.title}
      className={cn("group block rounded-(--radius-card) focus:outline-hidden", {
        "shelf-reveal": index !== undefined,
      })}
      style={
        index === undefined
          ? undefined
          : { animationDelay: `${Math.min(index, STAGGER_CAP - 1) * STAGGER_MS}ms` }
      }
      {...longPress()}
    >
      <div
        className={cn(
          "bg-default-200 relative aspect-2/3 w-full overflow-hidden",
          "rounded-(--radius-card) shadow-(--elevation-card) ring-1 ring-white/0",
          "transition duration-(--duration-base) ease-(--ease-out-quint) will-change-transform",
          "group-hover:scale-[1.04] group-hover:shadow-(--elevation-lift) group-hover:ring-white/15",
          "group-focus-visible:scale-[1.04] group-focus-visible:shadow-(--elevation-lift)",
          "group-focus-visible:ring-2 group-focus-visible:ring-white/70",
          "motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-focus-visible:scale-100",
        )}
      >
        {/* Decorative: the accessible name lives on the link, and the title is
            rendered as real text directly below the poster. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={media.posterUrl}
          alt=""
          aria-hidden="true"
          draggable={false}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          className={cn(
            "size-full object-cover object-center",
            "transition-transform duration-(--duration-base) ease-(--ease-out-quint)",
            "group-hover:scale-[1.06] group-focus-visible:scale-[1.06]",
            "motion-reduce:transition-none motion-reduce:group-hover:scale-100",
          )}
        />

        {media.isAdult && (
          <span className="glass-control absolute top-2 left-2 z-10 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide">
            18+
          </span>
        )}
        {badge && (
          <span className="glass-control absolute top-2 right-2 z-10 rounded-full border px-2 py-0.5 text-[10px] font-medium">
            {badge}
          </span>
        )}

        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 z-10 flex items-center justify-center",
            "opacity-0 transition-opacity duration-(--duration-base) ease-(--ease-out-quint)",
            "group-hover:opacity-100 group-focus-visible:opacity-100",
          )}
        >
          <span className="glass-control flex size-10 items-center justify-center rounded-full border">
            <PlayFilled size={14} className="ml-0.5" />
          </span>
        </span>
      </div>

      <div className="mt-2 flex flex-col gap-0.5">
        <p
          className={cn("truncate leading-tight font-medium", {
            "text-sm": variant === "rail",
            "text-sm sm:text-[0.9375rem]": variant === "grid",
          })}
        >
          {media.title}
        </p>
        {(media.year !== undefined || rating !== undefined) && (
          <p className="text-default-500 flex items-center gap-1.5 text-xs leading-tight">
            {media.year !== undefined && <span>{media.year}</span>}
            {media.year !== undefined && rating !== undefined && (
              <span aria-hidden="true">&#8226;</span>
            )}
            {rating !== undefined && (
              <span
                className="flex items-center gap-1"
                aria-label={`Rated ${rating.toFixed(1)} out of 10`}
              >
                <Star className="text-warning-500 size-3" aria-hidden="true" />
                {rating.toFixed(1)}
              </span>
            )}
          </p>
        )}
      </div>
    </Link>
  );

  return (
    <>
      <Tooltip
        isDisabled={mobile}
        // §11.2: was delay={1000}. A full second reads as broken; Netflix sits
        // around 300-400ms.
        delay={350}
        closeDelay={100}
        placement="right-start"
        className="glass-panel overflow-hidden rounded-(--radius-panel) border p-0"
        content={<HoverPreview media={media} />}
      >
        {card}
      </Tooltip>

      {mobile && (
        <VaulDrawer
          backdrop="blur"
          open={opened}
          onOpenChange={handlers.toggle}
          title={media.title}
          hiddenTitle
        >
          <HoverPreview media={media} fullWidth />
        </VaulDrawer>
      )}
    </>
  );
};

export default PosterCard;
