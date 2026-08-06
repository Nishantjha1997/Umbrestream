"use client";

import MediaRow from "@/components/media/MediaRow";
import { siteConfig } from "@/config/site";

export default function MediaHub({ kind }: { kind: "movie" | "tv" }) {
  const title = kind === "movie" ? "Movies" : "TV Shows";
  const copy =
    kind === "movie"
      ? "Big-screen stories, new releases, and all-time favourites."
      : "Series worth staying for, from tonight’s episodes to complete classics.";

  return (
    <div className="flex flex-col gap-10 pb-24 md:gap-14 md:pb-10">
      <header className="relative -mx-3 -mt-8 flex min-h-[34vh] items-end overflow-hidden border-b border-white/6 px-5 pb-10 sm:-mx-5 md:min-h-[42vh] md:px-10 md:pb-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_15%,rgba(139,92,246,.22),transparent_34%),radial-gradient(circle_at_18%_85%,rgba(59,130,246,.12),transparent_30%),linear-gradient(180deg,#17131f_0%,#0f1014_80%)]" />
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [mask-image:linear-gradient(to_bottom,black,transparent)] [background-size:44px_44px] opacity-25" />
        <div className="relative max-w-3xl">
          <p className="mb-3 text-xs font-semibold tracking-[0.24em] text-violet-300 uppercase">
            Umbra collection
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.045em] text-white sm:text-6xl md:text-7xl">
            {title}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/58 sm:text-base">{copy}</p>
        </div>
      </header>

      <div className="flex flex-col gap-12">
        {kind === "movie"
          ? siteConfig.queryLists.movies.map((row, index) => (
              <MediaRow key={row.name} kind="movie" priority={index === 0} {...row} />
            ))
          : siteConfig.queryLists.tvShows.map((row, index) => (
              <MediaRow key={row.name} kind="tv" priority={index === 0} {...row} />
            ))}
      </div>
    </div>
  );
}
