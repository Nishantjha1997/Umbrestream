"use client";

import ReliablePlayer from "@/components/player/ReliablePlayer";
import { siteConfig } from "@/config/site";
import { mutateMovieTitle } from "@/utils/movies";
import { getMoviePlayers } from "@/utils/players";
import { useDocumentTitle } from "@mantine/hooks";
import type { MovieDetails } from "tmdb-ts/dist/types/movies";
import MoviePlayerHeader from "./Header";

interface MoviePlayerProps {
  movie: MovieDetails;
  startAt?: number;
}

const MoviePlayer: React.FC<MoviePlayerProps> = ({ movie, startAt }) => {
  const title = mutateMovieTitle(movie);
  useDocumentTitle(`Play ${title} | ${siteConfig.name}`);

  return (
    <ReliablePlayer
      request={{ mediaType: "movie", tmdbId: movie.id, startAt, preferredSubtitle: "en" }}
      legacyPlayers={getMoviePlayers(movie.id, startAt)}
      color="primary"
      renderHeader={({ hidden, onOpenSource, fullscreen, onToggleFullscreen }) => (
        <MoviePlayerHeader
          id={movie.id}
          movieName={title}
          onOpenSource={onOpenSource}
          hidden={hidden}
          fullscreen={fullscreen}
          onToggleFullscreen={onToggleFullscreen}
        />
      )}
    />
  );
};

MoviePlayer.displayName = "MoviePlayer";

export default MoviePlayer;
