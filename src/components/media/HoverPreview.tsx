"use client";

import { anilistApi } from "@/api/anilist";
import { tmdbBrowser } from "@/api/tmdb-browser";
import BookmarkButton from "@/components/ui/button/BookmarkButton";
import type { MediaSummary } from "@/types/media";
import type { SavedMovieDetails } from "@/types/movie";
import { cn, isEmpty } from "@/utils/helpers";
import { Calendar, Clock, List, PlayFilled, Season, Star } from "@/utils/icons";
import { getMovieLastPosition } from "@/actions/histories";
import { getCinematicBackdropUrl, getImageUrl, movieDurationString } from "@/utils/movies";
import { Button, Link, Skeleton } from "@heroui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

/**
 * The single hover/long-press preview panel.
 *
 * Replaces {Movie,TV,Anime}/Cards/Hover.tsx. Those three fetched from
 * different clients and rendered three near-identical layouts in three
 * different accent colours; the only real difference is which facts each
 * source can supply, so that is all that branches here.
 *
 * §11.4: the old loading state was a bare <Spinner> in a black h-96 w-80 box —
 * a hard black rectangle popping in beside the poster you were already looking
 * at. The caller always has a MediaSummary in hand, so the pending state now
 * renders the real art and title immediately and skeletons only the parts
 * still in flight.
 */

interface HoverPreviewProps {
  media: MediaSummary;
  /** Mobile drawer wants the panel to fill its container. */
  fullWidth?: boolean;
}

interface Fact {
  icon: React.ReactNode;
  label: string;
}

interface PreviewModel {
  heroUrl: string;
  logoUrl?: string;
  kindLabel: string;
  title: string;
  facts: Fact[];
  rating?: number;
  genres: string[];
  overview?: string;
  playHref: string;
  playLabel: string;
  bookmark?: SavedMovieDetails;
}

const KIND_FALLBACK_LABEL: Record<MediaSummary["kind"], string> = {
  movie: "Movie",
  tv: "TV",
  anime: "Anime",
};

function playHrefFor(media: MediaSummary): string {
  if (media.kind === "movie") return `/movie/${media.id}/player`;
  if (media.kind === "anime") return `/anime/${media.id}/player/1`;
  return `/tv/${media.id}`;
}

function playLabelFor(media: MediaSummary): string {
  if (media.kind === "tv") return "View Episodes";
  return "Play Now";
}

async function fetchPreview(media: MediaSummary) {
  if (media.kind === "movie") {
    return {
      kind: "movie",
      detail: await tmdbBrowser.movies.details(media.id, ["images"]),
    } as const;
  }
  if (media.kind === "tv") {
    return { kind: "tv", detail: await tmdbBrowser.tvShows.details(media.id, ["images"]) } as const;
  }
  const anime = await anilistApi.details(media.id);
  // AniList answers `Media: null` for an id it no longer serves. Throwing
  // routes that into the panel's error branch instead of silently rendering a
  // half-empty card.
  if (!anime) throw new Error(`AniList has no record for id ${media.id}`);
  return { kind: "anime", detail: anime } as const;
}

type PreviewQueryResult = Awaited<ReturnType<typeof fetchPreview>>;

const HoverPreview: React.FC<HoverPreviewProps> = ({ media, fullWidth }) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (media.kind === "movie") {
      void queryClient.prefetchQuery({
        queryKey: ["movie-player-detail", media.id],
        queryFn: () => tmdbBrowser.movies.details(media.id),
      });
      void queryClient.prefetchQuery({
        queryKey: ["movie-player-start-at", media.id],
        queryFn: () => getMovieLastPosition(media.id),
      });
    } else if (media.kind === "tv") {
      void queryClient.prefetchQuery({
        queryKey: ["tv-show-player-details", media.id],
        queryFn: () => tmdbBrowser.tvShows.details(media.id),
      });
    } else if (media.kind === "anime") {
      void queryClient.prefetchQuery({
        queryKey: ["anime-player-details", media.id],
        queryFn: () => anilistApi.details(media.id),
      });
    }
  }, [media.id, media.kind, queryClient]);

  const { data, isPending, isError } = useQuery({
    queryKey: ["media-hover-preview", media.kind, media.id],
    queryFn: () => fetchPreview(media),
    // The panel is cheap to keep around and expensive to refetch on every
    // re-hover of the same card.
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });

  const model = data ? toModel(media, data) : undefined;

  const heroUrl = model?.heroUrl ?? media.backdropUrl ?? media.posterUrl;
  const title = model?.title ?? media.title;
  const kindLabel = model?.kindLabel ?? media.format ?? KIND_FALLBACK_LABEL[media.kind];

  return (
    <article
      className={cn("w-80 max-w-[calc(100vw-2rem)] overflow-hidden", {
        "w-full max-w-none": fullWidth,
      })}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-black/40">
        {!isEmpty(heroUrl) && (
          // Decorative: the title is rendered as text directly below.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroUrl}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="size-full object-cover object-center"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/30 to-transparent" />
        {model?.logoUrl && !isEmpty(model.logoUrl) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={model.logoUrl}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="absolute top-1/2 left-1/2 max-h-24 w-4/5 -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-xl"
          />
        )}
      </div>

      <div className="flex flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="glass-control rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase">
            {kindLabel}
          </span>
          {media.isAdult && (
            <span className="glass-control text-danger-400 rounded-full border px-2 py-0.5 text-[11px] font-semibold">
              18+
            </span>
          )}
        </div>

        <h3 className="text-lg leading-tight font-semibold text-balance">{title}</h3>

        {isPending ? (
          <PreviewSkeleton />
        ) : isError || !model ? (
          <p className="text-default-500 text-sm">
            Details are unavailable right now. Open the title page for the full record.
          </p>
        ) : (
          <>
            <div className="text-default-500 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              {model.facts.map((fact, i) => (
                <span key={fact.label} className="flex items-center gap-1">
                  {i > 0 && (
                    <span aria-hidden="true" className="mr-1">
                      &#8226;
                    </span>
                  )}
                  {fact.icon}
                  {fact.label}
                </span>
              ))}
              {model.rating !== undefined && model.rating > 0 && (
                <span
                  className="flex items-center gap-1"
                  aria-label={`Rated ${model.rating.toFixed(1)} out of 10`}
                >
                  {model.facts.length > 0 && (
                    <span aria-hidden="true" className="mr-1">
                      &#8226;
                    </span>
                  )}
                  <Star className="text-warning-500 size-3" aria-hidden="true" />
                  {model.rating.toFixed(1)}
                </span>
              )}
            </div>

            {!isEmpty(model.genres) && (
              <div className="flex flex-wrap gap-1.5">
                {model.genres.slice(0, 4).map((genre) => (
                  <span
                    key={genre}
                    className="border-default-200/60 bg-default-100/50 rounded-full border px-2 py-0.5 text-[11px]"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}
          </>
        )}

        <div className="flex w-full items-center gap-2 py-1">
          <Button
            as={Link}
            href={playHrefFor(media)}
            fullWidth
            radius="full"
            // Flat pill, not variant="shadow" — the coloured glow reads
            // distinctly non-Apple (§9).
            className="bg-foreground text-background font-semibold"
            startContent={<PlayFilled size={14} />}
          >
            {playLabelFor(media)}
          </Button>
          {model?.bookmark && <BookmarkButton data={model.bookmark} isTooltipDisabled />}
        </div>

        {isPending ? (
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-3 w-11/12 rounded-full" />
            <Skeleton className="h-3 w-2/3 rounded-full" />
          </div>
        ) : (
          model?.overview && <p className="line-clamp-5 text-sm">{model.overview}</p>
        )}
      </div>
    </article>
  );
};

const PreviewSkeleton: React.FC = () => (
  <div className="flex flex-col gap-2">
    <Skeleton className="h-3 w-3/4 rounded-full" />
    <div className="flex gap-1.5">
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-5 w-14 rounded-full" />
      <Skeleton className="h-5 w-20 rounded-full" />
    </div>
  </div>
);

function englishLogo(logos: { iso_639_1: string | null; file_path: string }[]): string | undefined {
  const path = logos.find((logo) => logo.iso_639_1 === "en")?.file_path;
  if (!path) return undefined;
  const url = getImageUrl(path, "title");
  return isEmpty(url) ? undefined : url;
}

function toModel(media: MediaSummary, result: PreviewQueryResult): PreviewModel {
  if (result.kind === "movie") {
    const movie = result.detail;
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : undefined;
    return {
      heroUrl:
        getCinematicBackdropUrl(
          movie.images.backdrops,
          getImageUrl(movie.backdrop_path, "backdrop"),
        ) ?? getImageUrl(movie.backdrop_path, "backdrop", true),
      logoUrl: englishLogo(movie.images.logos),
      kindLabel: "Movie",
      title: movie.title || media.title,
      facts: [
        {
          icon: <Clock className="size-3" aria-hidden="true" />,
          label: movieDurationString(movie.runtime),
        },
        ...(year
          ? [{ icon: <Calendar className="size-3" aria-hidden="true" />, label: String(year) }]
          : []),
      ],
      rating: movie.vote_average,
      genres: movie.genres.map((g) => g.name),
      overview: movie.overview,
      playHref: `/movie/${movie.id}/player`,
      playLabel: "Play Now",
      bookmark: {
        type: "movie",
        adult: movie.adult,
        backdrop_path: movie.backdrop_path,
        id: movie.id,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        title: movie.title || media.title,
        vote_average: movie.vote_average,
        saved_date: new Date().toISOString(),
      },
    };
  }

  if (result.kind === "tv") {
    const tv = result.detail;
    const first = tv.first_air_date ? new Date(tv.first_air_date).getFullYear() : undefined;
    const last = tv.last_air_date ? new Date(tv.last_air_date).getFullYear() : undefined;
    const years = first
      ? last && last !== first
        ? `${first} – ${last}`
        : String(first)
      : undefined;
    return {
      heroUrl:
        getCinematicBackdropUrl(tv.images.backdrops, getImageUrl(tv.backdrop_path, "backdrop")) ??
        getImageUrl(tv.backdrop_path, "backdrop", true),
      logoUrl: englishLogo(tv.images.logos),
      kindLabel: "TV",
      title: tv.name || media.title,
      facts: [
        {
          icon: <Season className="size-3" aria-hidden="true" />,
          label: `${tv.number_of_seasons} Season${tv.number_of_seasons === 1 ? "" : "s"}`,
        },
        {
          icon: <List className="size-3" aria-hidden="true" />,
          label: `${tv.number_of_episodes} Episode${tv.number_of_episodes === 1 ? "" : "s"}`,
        },
        ...(years
          ? [{ icon: <Calendar className="size-3" aria-hidden="true" />, label: years }]
          : []),
      ],
      rating: tv.vote_average,
      genres: tv.genres.map((g) => g.name),
      overview: tv.overview,
      playHref: `/tv/${tv.id}`,
      playLabel: "View Episodes",
      bookmark: {
        type: "tv",
        adult: "adult" in tv ? Boolean(tv.adult) : false,
        backdrop_path: tv.backdrop_path,
        id: tv.id,
        poster_path: tv.poster_path,
        release_date: tv.first_air_date,
        title: tv.name || media.title,
        vote_average: tv.vote_average,
        saved_date: new Date().toISOString(),
      },
    };
  }

  const anime = result.detail;
  const season = anime.season
    ? anime.season.charAt(0) + anime.season.slice(1).toLowerCase()
    : undefined;
  const seasonLabel = [season, anime.seasonYear].filter(Boolean).join(" ");

  return {
    heroUrl:
      anime.bannerImage ?? anime.coverImage.extraLarge ?? anime.coverImage.large ?? media.posterUrl,
    kindLabel: media.format ?? "Anime",
    title: anime.title.english ?? anime.title.romaji ?? anime.title.native ?? media.title,
    facts: [
      ...(anime.duration
        ? [
            {
              icon: <Clock className="size-3" aria-hidden="true" />,
              label: movieDurationString(anime.duration),
            },
          ]
        : []),
      ...(seasonLabel
        ? [{ icon: <Calendar className="size-3" aria-hidden="true" />, label: seasonLabel }]
        : []),
      ...(anime.episodes
        ? [
            {
              icon: <List className="size-3" aria-hidden="true" />,
              label: `${anime.episodes} Episode${anime.episodes === 1 ? "" : "s"}`,
            },
          ]
        : []),
    ],
    // AniList scores 0-100 everywhere; this panel shows 0-10 like the rest.
    rating: anime.averageScore != null ? anime.averageScore / 10 : undefined,
    genres: anime.genres,
    // `description(asHtml: false)` still leaks the occasional stray tag.
    overview: anime.description?.replace(/<[^>]*>/g, "") ?? undefined,
    playHref: `/anime/${anime.id}/player/1`,
    playLabel: "Play Now",
  };
}

export default HoverPreview;
