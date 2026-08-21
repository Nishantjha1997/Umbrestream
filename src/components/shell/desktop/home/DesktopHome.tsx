"use client";

/**
 * The desktop Home composition (DESKTOP_SPEC.md §E1) — a 560px landscape
 * hero flush against the top of the content column, then six sections at a
 * denser, more uniform desktop rhythm. Replaces the old Home page, which
 * just stacked `<Hero>` / `<ContinueWatching>` / `<Recommended>`; none of
 * that structure survives here. The only export a caller needs.
 */

import DesktopHero from "./DesktopHero";
import NextEpisodeDropsDesktop from "./NextEpisodeDropsDesktop";
import RoomIsOpenDesktop from "./RoomIsOpenDesktop";
import StillWatchingDesktop from "./StillWatchingDesktop";
import TonightInset from "./TonightInset";
import VibeTilesDesktop from "./VibeTilesDesktop";
import HomeDiscoveryFeed from "@/components/sections/Home/HomeDiscoveryFeed";
import AnimeModeEntry from "@/components/sections/Home/AnimeModeEntry";

export default function DesktopHome() {
  return (
    <div id="desktop-home-top" className="relative flex flex-col gap-[42px] pb-16">
      <DesktopHero />
      <AnimeModeEntry />
      <StillWatchingDesktop />
      <HomeDiscoveryFeed idPrefix="desktop" variant="desktop" />
      <TonightInset />
      <VibeTilesDesktop />
      <NextEpisodeDropsDesktop />
      <RoomIsOpenDesktop />
    </div>
  );
}
