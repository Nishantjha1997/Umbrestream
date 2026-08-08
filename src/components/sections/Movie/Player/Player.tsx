"use client";

import PlayerShell from "@/components/player/PlayerShell";
import { siteConfig } from "@/config/site";
import type { SourceRequest } from "@/lib/sources/types";
import { mutateMovieTitle } from "@/utils/movies";
import { useDocumentTitle } from "@mantine/hooks";
import { useMemo } from "react";
import type { MovieDetails } from "tmdb-ts/dist/types/movies";
import MoviePlayerHeader from "./Header";

interface MoviePlayerProps {
  movie: MovieDetails;
  startAt?: number;
}

/**
 * Movie playback on the shared `PlayerShell` (Phase 6, §10 — see
 * `TV/Player/Player.tsx` for the reference implementation this mirrors).
 * Movies have no seasons/episodes, so there is no `historyMetadata` and no
 * `renderExtras`.
 */
const MoviePlayer: React.FC<MoviePlayerProps> = ({ movie, startAt }) => {
  const title = mutateMovieTitle(movie);
  useDocumentTitle(`Play ${title} | ${siteConfig.name}`);

  const request = useMemo<SourceRequest>(
    () => ({
      mediaType: "movie",
      tmdbId: movie.id,
      startAt,
      preferredSubtitle: "en",
    }),
    [movie.id, startAt],
  );

  const identity = useMemo(
    () => ({ mediaId: movie.id, mediaType: "movie" as const }),
    [movie.id],
  );

  return (
    <PlayerShell
      request={request}
      identity={identity}
      renderHeader={({ onOpenSource }) => (
        <MoviePlayerHeader
          id={movie.id}
          movieName={title}
          onOpenSource={onOpenSource}
        />
      )}
    />
  );
};

MoviePlayer.displayName = "MoviePlayer";

export default MoviePlayer;
