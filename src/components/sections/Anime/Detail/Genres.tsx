import { Chip, ChipProps } from "@heroui/react";
import { isEmpty } from "@/utils/helpers";

export interface AnimeGenresProps {
  genres: string[];
  chipProps?: Omit<ChipProps, "children" | "key">;
}

/**
 * Plain (non-linking) chip list for AniList's `genres: string[]`.
 *
 * Unlike @/components/ui/other/Genres.tsx, these don't link anywhere —
 * AniList genre strings don't map to TMDB genre ids, and the anime browse
 * page (owned by another agent) may or may not support a genre filter, so
 * these stay decorative rather than guessing at a query-param contract.
 */
const AnimeGenres: React.FC<AnimeGenresProps> = ({
  genres,
  chipProps = {
    size: "sm",
    variant: "flat",
    color: "secondary",
    radius: "full",
  },
}) => {
  if (isEmpty(genres)) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {genres.map((genre) => (
        <Chip key={genre} {...chipProps}>
          {genre}
        </Chip>
      ))}
    </div>
  );
};

export default AnimeGenres;
