"use client";

import SectionTitle from "@/components/ui/other/SectionTitle";
import Carousel from "@/components/ui/wrapper/Carousel";
import { isEmpty } from "@/utils/helpers";
import { getImageUrl } from "@/utils/movies";
import { Cast } from "tmdb-ts";

/**
 * TMDB returns the *entire* credited cast, which for a large production runs to
 * a hundred-plus names. A "Top Casts" rail is a browsing aid, not a database
 * dump, so it stops at the billing order TMDB already sorted for us.
 */
const MAX_CAST = 20;

/** "Cillian Murphy" → "CM". Used when a person has no profile photo. */
const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

export interface CastRailProps {
  casts: Cast[];
}

/**
 * Portrait cast shelf.
 *
 * Replaces HeroUI's `User` — a small circular avatar with two lines of text
 * beside it, which is a form/table-row widget, not a cast shelf (§8). Netflix
 * and Apple TV+ both use portrait cards, and a 2:3 crop of a headshot reads as
 * a person rather than as a list entry.
 *
 * Nothing here is interactive: the app has no person route, so these are
 * deliberately not links or buttons. Adding a pressable card that navigates
 * nowhere is worse than a static one.
 */
const CastRail: React.FC<CastRailProps> = ({ casts }) => {
  const visible = casts.slice(0, MAX_CAST);

  if (isEmpty(visible)) return null;

  return (
    <section id="casts" className="z-3 flex flex-col gap-3">
      <SectionTitle size="h5">Top Casts</SectionTitle>
      <Carousel>
        {visible.map((cast) => {
          const photo = getImageUrl(cast.profile_path, "avatar");

          return (
            // flex-none! overrides the shared Carousel module's
            // `.container > * { flex: 0 0 100% }`, which would otherwise ignore
            // the width and leave the card with no intrinsic size.
            <div
              key={`${cast.id}-${cast.credit_id}`}
              className="w-[104px] flex-none! px-1 pt-1 pb-3 sm:w-[116px] md:w-[128px]"
            >
              <figure className="flex flex-col gap-2">
                <div className="relative aspect-2/3 overflow-hidden rounded-(--radius-card) bg-default-200 shadow-(--elevation-card)">
                  {photo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={photo}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      className="size-full object-cover object-center"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="flex size-full items-center justify-center text-lg font-medium text-default-500"
                    >
                      {initials(cast.name)}
                    </span>
                  )}
                </div>
                <figcaption className="flex flex-col gap-0.5">
                  <p className="line-clamp-2 text-[13px] leading-snug font-medium">{cast.name}</p>
                  {cast.character && (
                    <p className="line-clamp-2 text-[11px] leading-snug text-default-500">
                      {cast.character}
                    </p>
                  )}
                </figcaption>
              </figure>
            </div>
          );
        })}
      </Carousel>
    </section>
  );
};

export default CastRail;
