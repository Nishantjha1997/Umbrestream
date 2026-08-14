import { tmdbBrowser } from "@/api/tmdb-browser";
import { SiteConfigType } from "@/types";
import { Movie, TV } from "tmdb-ts/dist/types";
import { BiCategory, BiSearchAlt2, BiSolidCategory, BiSolidSearchAlt2 } from "react-icons/bi";
import { GoHomeFill, GoHome } from "react-icons/go";
import { HiComputerDesktop } from "react-icons/hi2";
import { IoIosSunny } from "react-icons/io";
import { IoMoon } from "react-icons/io5";
import { TbUserCircle, TbUserFilled } from "react-icons/tb";
import { PiFlowerLotusLight, PiFlowerLotusFill } from "react-icons/pi";
import { brand } from "@/config/brand";

/**
 * Matches QueryList<T>["query"]'s return shape. MediaRow.tsx calls these
 * closures from inside a Client Component via react-query, so they must go
 * through tmdbBrowser (the /api/tmdb proxy) rather than the server-only
 * tmdb client — that's the whole reason this file used to need a
 * NEXT_PUBLIC_ token.
 */
type PagedResult<T> = {
  page: number;
  results: T[];
  total_results: number;
  total_pages: number;
};

export const siteConfig: SiteConfigType = {
  name: brand.name,
  seoTitle: "StreamFree | Discover Movies, TV Series & Anime",
  description: brand.description,
  keywords: [
    "streamfree",
    "stream free",
    "streamfree online",
    "umbrestream",
    "umbra stream",
    "movies",
    "watch movies online",
    "movies and TV shows",
    "TV series streaming",
    "anime streaming",
    "watch anime online",
    "movie discovery",
    "subtitles",
    "mobile streaming",
    "StreamFree Android app",
    "StreamFree Android TV app",
    "regional movie recommendations",
    "anime discovery",
  ],
  favicon: "/streamfree-mark.svg",
  // Five items (Phase 3, §7 — "Seven dock items, two of which go nowhere").
  // Movies, TV, and Categories folded into Browse as segments
  // (`/app/browse/page.tsx`); Sports and Sparks (desktopOnly preview chips
  // that went nowhere) dropped from the nav entirely — their pages still
  // exist at their URLs, just unreachable from chrome until finding 08's
  // "Soon" redesign lands. "My Space" renamed "You" per the design's v2
  // mockup (v1 called it "My Space"; v2 is authoritative — see
  // `docs/design/PHONE_SPEC.md` §E note). The route stays `/space`: renaming
  // the URL too would need a redirect for zero benefit.
  navItems: [
    {
      label: "Home",
      href: "/",
      icon: <GoHome className="size-full" />,
      activeIcon: <GoHomeFill className="size-full" />,
      dockOrder: 0,
    },
    {
      label: "Search",
      href: "/search",
      icon: <BiSearchAlt2 className="size-full" />,
      activeIcon: <BiSolidSearchAlt2 className="size-full" />,
      dockOrder: 1,
    },
    {
      label: "Browse",
      href: "/browse",
      icon: <BiCategory className="size-full" />,
      activeIcon: <BiSolidCategory className="size-full" />,
      dockOrder: 2,
    },
    {
      label: "Anime",
      href: "/anime",
      icon: <PiFlowerLotusLight className="size-full" />,
      activeIcon: <PiFlowerLotusFill className="size-full" />,
      dockOrder: 3,
    },
    {
      label: "You",
      href: "/space",
      icon: <TbUserCircle className="size-full" />,
      activeIcon: <TbUserFilled className="size-full" />,
      dockOrder: 4,
    },
  ],
  themes: [
    {
      name: "light",
      icon: <IoIosSunny className="size-full" />,
    },
    {
      name: "dark",
      icon: <IoMoon className="size-full" />,
    },
    {
      name: "system",
      icon: <HiComputerDesktop className="size-full" />,
    },
  ],
  queryLists: {
    movies: [
      {
        name: "Today's Trending Movies",
        query: () => tmdbBrowser.trending.trending<PagedResult<Movie>>("movie", "day"),
        param: "todayTrending",
      },
      {
        name: "This Week's Trending Movies",
        query: () => tmdbBrowser.trending.trending<PagedResult<Movie>>("movie", "week"),
        param: "thisWeekTrending",
      },
      {
        name: "Popular Movies",
        query: () => tmdbBrowser.movies.popular<PagedResult<Movie>>(),
        param: "popular",
      },
      {
        name: "Now Playing Movies",
        query: () => tmdbBrowser.movies.nowPlaying<PagedResult<Movie>>(),
        param: "nowPlaying",
      },
      {
        name: "Upcoming Movies",
        query: () => tmdbBrowser.movies.upcoming<PagedResult<Movie>>(),
        param: "upcoming",
      },
      {
        name: "Top Rated Movies",
        query: () => tmdbBrowser.movies.topRated<PagedResult<Movie>>(),
        param: "topRated",
      },
    ],
    tvShows: [
      {
        name: "Today's Trending TV Shows",
        query: () => tmdbBrowser.trending.trending<PagedResult<TV>>("tv", "day"),
        param: "todayTrending",
      },
      {
        name: "This Week's Trending TV Shows",
        query: () => tmdbBrowser.trending.trending<PagedResult<TV>>("tv", "week"),
        param: "thisWeekTrending",
      },
      {
        name: "Popular TV Shows",
        query: () => tmdbBrowser.tvShows.popular<PagedResult<TV>>(),
        param: "popular",
      },
      {
        name: "On The Air TV Shows",
        query: () => tmdbBrowser.tvShows.onTheAir<PagedResult<TV>>(),
        param: "onTheAir",
      },
      {
        name: "Top Rated TV Shows",
        query: () => tmdbBrowser.tvShows.topRated<PagedResult<TV>>(),
        param: "topRated",
      },
    ],
  },
  socials: {
    github: "https://github.com/Nishantjha1997/Umbrestream",
  },
};

export type SiteConfig = typeof siteConfig;
