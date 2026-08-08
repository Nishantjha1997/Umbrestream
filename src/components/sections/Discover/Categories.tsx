"use client";

/**
 * The categories genre-tile grid, extracted from `app/categories/page.tsx`
 * (Phase 3, §7) so it can render as a segment inside `/browse` instead of
 * its own route. `/categories` now redirects here (`next.config.ts`).
 */

import Link from "next/link";

/** Reused by the home "In the mood for" vibe tiles (Phase 4, §8). */
export const movieGenres = [
  [28, "Action"],
  [12, "Adventure"],
  [16, "Animation"],
  [35, "Comedy"],
  [80, "Crime"],
  [18, "Drama"],
  [14, "Fantasy"],
  [27, "Horror"],
  [9648, "Mystery"],
  [878, "Science Fiction"],
  [53, "Thriller"],
  [10749, "Romance"],
] as const;

const animeGenres = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Mystery",
  "Romance",
  "Sci-Fi",
];

const tileColors = [
  "from-violet-500/35 to-indigo-950/20",
  "from-cyan-500/30 to-blue-950/20",
  "from-fuchsia-500/30 to-violet-950/20",
  "from-amber-500/30 to-orange-950/20",
];

export default function CategoriesSection() {
  return (
    <div className="flex flex-col gap-12">
      <section>
        <h2 className="mb-5 text-xl font-semibold">Movies & TV</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {movieGenres.map(([id, name], index) => (
            <Link
              key={id}
              href={`/discover?type=discover&genres=${id}`}
              className={`group relative min-h-32 overflow-hidden rounded-2xl border border-white/8 bg-linear-to-br ${tileColors[index % tileColors.length]} p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/18 hover:shadow-2xl hover:shadow-black/40 focus-visible:ring-2 focus-visible:ring-violet-300/70 focus-visible:outline-none`}
            >
              <span className="absolute -right-5 -bottom-8 text-8xl font-black text-white/[0.035] transition-transform duration-500 group-hover:scale-110">
                {name.slice(0, 1)}
              </span>
              <span className="relative text-lg font-semibold text-white">{name}</span>
              <span className="relative mt-2 block text-xs text-white/45">Browse collection</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-5 text-xl font-semibold">Anime</h2>
        <div className="flex flex-wrap gap-2.5">
          {animeGenres.map((genre) => (
            <Link
              key={genre}
              href={`/anime/discover?genre=${encodeURIComponent(genre)}`}
              className="min-h-11 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/70 transition-all duration-200 hover:border-violet-300/35 hover:bg-violet-400/12 hover:text-white focus-visible:ring-2 focus-visible:ring-violet-300/70 focus-visible:outline-none"
            >
              {genre}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
