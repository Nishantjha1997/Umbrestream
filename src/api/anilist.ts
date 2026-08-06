import type {
  AniListMediaDetail,
  AniListMediaSummary,
  AniListPage,
  AniListSort,
} from "@/types/anilist";

const ENDPOINT = "https://graphql.anilist.co";

/**
 * AniList's public GraphQL API needs no key. Safe to call from either server
 * or client components — unlike @/api/tmdb, there's no secret to protect
 * here, so there's no browser-proxy variant of this module.
 *
 * Rate limit is modest (documented around 30 req/min at the time this was
 * written). Server Components get Next's fetch cache for free via
 * `revalidate`; client-side callers should still prefer react-query's cache
 * over calling this on every render.
 */
async function anilist<T>(
  query: string,
  variables: Record<string, unknown>,
  revalidateSeconds = 3600,
): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: revalidateSeconds },
  });

  const json = await res.json();

  if (!res.ok || json.errors) {
    const message = json.errors?.[0]?.message ?? `AniList request failed: ${res.status}`;
    throw new Error(message);
  }

  return json.data as T;
}

const MEDIA_SUMMARY_FIELDS = `
  id
  idMal
  title { romaji english native }
  coverImage { extraLarge large medium color }
  format
  episodes
  averageScore
  seasonYear
  isAdult
`;

const MEDIA_DETAIL_FIELDS = `
  ${MEDIA_SUMMARY_FIELDS}
  bannerImage
  description(asHtml: false)
  status
  duration
  season
  genres
  popularity
  studios(isMain: true) { nodes { id name } }
  startDate { year month day }
  endDate { year month day }
  nextAiringEpisode { episode airingAt timeUntilAiring }
  trailer { id site thumbnail }
  recommendations(sort: RATING_DESC, perPage: 12) {
    nodes { mediaRecommendation { ${MEDIA_SUMMARY_FIELDS} } }
  }
`;

interface RawStudios {
  nodes: { id: number; name: string }[];
}

interface RawRecommendations {
  nodes: { mediaRecommendation: AniListMediaSummary | null }[];
}

type RawDetail = AniListMediaSummary &
  Omit<AniListMediaDetail, "studios" | "recommendations"> & {
    studios: RawStudios;
    recommendations: RawRecommendations;
  };

function normalizeDetail(raw: RawDetail): AniListMediaDetail {
  return {
    ...raw,
    studios: raw.studios.nodes,
    recommendations: raw.recommendations.nodes
      .map((n) => n.mediaRecommendation)
      .filter((m): m is AniListMediaSummary => m !== null),
  };
}

const PAGE_QUERY = `
  query ($page: Int, $perPage: Int, $sort: [MediaSort], $season: MediaSeason, $seasonYear: Int, $search: String, $genre: String) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total currentPage lastPage hasNextPage }
      media(type: ANIME, sort: $sort, season: $season, seasonYear: $seasonYear, search: $search, genre: $genre, isAdult: false) {
        ${MEDIA_SUMMARY_FIELDS}
      }
    }
  }
`;

interface PageQueryVars {
  page?: number;
  perPage?: number;
  sort?: AniListSort[];
  season?: string;
  seasonYear?: number;
  search?: string;
  genre?: string;
}

async function fetchPage(vars: PageQueryVars): Promise<AniListPage<AniListMediaSummary>> {
  const data = await anilist<{ Page: AniListPage<AniListMediaSummary> }>(PAGE_QUERY, {
    page: 1,
    perPage: 24,
    ...vars,
  });
  return data.Page;
}

export const anilistApi = {
  trending: () => fetchPage({ sort: ["TRENDING_DESC"] }),
  popular: () => fetchPage({ sort: ["POPULARITY_DESC"] }),
  topRated: () => fetchPage({ sort: ["SCORE_DESC"] }),

  /** Current airing season, e.g. thisSeason(2026, "SPRING"). */
  thisSeason: (seasonYear: number, season: string) =>
    fetchPage({ sort: ["POPULARITY_DESC"], season, seasonYear }),

  search: (query: string, page = 1) => fetchPage({ search: query, page, perPage: 20 }),

  discover: (vars: PageQueryVars) => fetchPage(vars),

  /**
   * Returns `null` only when the anime genuinely doesn't exist.
   *
   * Request failures throw. They used to be swallowed into `null`, which
   * callers then rendered as a hard 404 — so a transient AniList hiccup (their
   * rate limit sits around 30 req/min and this app fans out across several
   * rows) turned a valid title into "page not found". Swallowing also defeated
   * react-query's retry entirely, since a resolved `null` looks like success.
   */
  details: async (id: number): Promise<AniListMediaDetail | null> => {
    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          ${MEDIA_DETAIL_FIELDS}
        }
      }
    `;
    const data = await anilist<{ Media: RawDetail | null }>(query, { id });
    return data.Media ? normalizeDetail(data.Media) : null;
  },
};

/** Sun-based year/season, matching AniList's own MediaSeason boundaries. */
export function currentAniListSeason(): { seasonYear: number; season: string } {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  const seasons = [
    "WINTER",
    "WINTER",
    "SPRING",
    "SPRING",
    "SPRING",
    "SUMMER",
    "SUMMER",
    "SUMMER",
    "FALL",
    "FALL",
    "FALL",
    "WINTER",
  ];
  return { seasonYear: now.getFullYear(), season: seasons[month] };
}
