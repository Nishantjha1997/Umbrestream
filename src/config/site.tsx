import { tmdbBrowser } from "@/api/tmdb-browser";
import { SiteConfigType } from "@/types";
import { Movie, TV } from "tmdb-ts/dist/types";
import { BiSearchAlt2, BiSolidSearchAlt2 } from "react-icons/bi";
import { GoHomeFill, GoHome } from "react-icons/go";
import { HiComputerDesktop } from "react-icons/hi2";
import { IoIosSunny } from "react-icons/io";
import {
  IoCompass,
  IoCompassOutline,
  IoInformationCircle,
  IoInformationCircleOutline,
  IoMoon,
} from "react-icons/io5";
import { TbFolder, TbFolderFilled } from "react-icons/tb";
import { PiFlowerLotusLight, PiFlowerLotusFill } from "react-icons/pi";

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
  name: "Umbra",
  description: "Discover movies, TV shows, and anime in one place.",
  favicon: "/favicon.ico",
  navItems: [
    {
      label: "Home",
      href: "/",
      icon: <GoHome className="size-full" />,
      activeIcon: <GoHomeFill className="size-full" />,
    },
    {
      label: "Discover",
      href: "/discover",
      icon: <IoCompassOutline className="size-full" />,
      activeIcon: <IoCompass className="size-full" />,
    },
    {
      label: "Anime",
      href: "/anime",
      icon: <PiFlowerLotusLight className="size-full" />,
      activeIcon: <PiFlowerLotusFill className="size-full" />,
    },
    {
      label: "Search",
      href: "/search",
      icon: <BiSearchAlt2 className="size-full" />,
      activeIcon: <BiSolidSearchAlt2 className="size-full" />,
    },
    {
      label: "Library",
      href: "/library",
      icon: <TbFolder className="size-full" />,
      activeIcon: <TbFolderFilled className="size-full" />,
    },
    {
      label: "About",
      href: "/about",
      icon: <IoInformationCircleOutline className="size-full" />,
      activeIcon: <IoInformationCircle className="size-full" />,
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
