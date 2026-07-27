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
 *
 * Deliberately colourless: genre is not taxonomy to encode in hue (§1.1.3),
 * and these sit under the synopsis as tertiary metadata.
 */
const AnimeGenres: React.FC<AnimeGenresProps> = ({
  genres,
  chipProps = {
    size: "sm",
    variant: "bordered",
    radius: "full",
    classNames: {
      base: "border-default-200/60 h-6",
      content: "text-default-500 text-xs px-2",
    },
  },
}) => {
  if (isEmpty(genres)) return null;

  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Genres">
      {genres.map((genre) => (
        <li key={genre}>
          <Chip {...chipProps}>{genre}</Chip>
        </li>
      ))}
    </ul>
  );
};

export default AnimeGenres;
