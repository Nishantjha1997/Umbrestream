"use client";

/**
 * Phone Home (`PHONE_SPEC.md` §C.1 + §G) — an unnumbered resume hero
 * followed by six numbered sections, each a deliberately different shape.
 * That alternation is the whole design point: no two consecutive sections
 * look structurally alike. This is the only file meant to be imported by
 * `page.tsx`; every other file in this directory is a piece of this
 * composition, not a standalone export.
 *
 * `<main>`'s ambient padding (`SpacingClasses.main` — `px-3 py-8 sm:px-5`,
 * `src/utils/constants.ts`) is 12px on every real phone width, never the
 * spec's 20px, and has no equivalent for section 02's zero-gutter bleed.
 * This cancels it once at the root with a `-mx-3 -mt-8 sm:-mx-5` bleed, so
 * every section below can apply the spec's exact gutter itself instead of
 * fighting an ambient one.
 */

import NextEpisodeDrops from "./NextEpisodeDrops";
import ResumeHero from "./ResumeHero";
import RoomIsOpen from "./RoomIsOpen";
import StillWatching from "./StillWatching";
import Tonight from "./Tonight";
import TrendingToday from "./TrendingToday";
import VibeTiles from "./VibeTiles";

export default function PhoneHome() {
  return (
    <div className="-mx-3 -mt-8 flex flex-col gap-[46px] sm:-mx-5">
      <ResumeHero />
      <StillWatching />
      <Tonight />
      <VibeTiles />
      <NextEpisodeDrops />
      <TrendingToday />
      <RoomIsOpen />
    </div>
  );
}
