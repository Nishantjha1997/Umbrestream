import { AniListStudio } from "@/types/anilist";
import { isEmpty } from "@/utils/helpers";

interface AnimeStudiosSectionProps {
  studios: AniListStudio[];
}

/**
 * Fills the "Casts" slot in the detail-page layout. AniList's queried fields
 * don't include voice-cast data, so studios (the closest AniList equivalent to
 * a credited-people section) get their own line here.
 *
 * Rendered as a real credits line — a labelled `dl` row, not a shelf of chips.
 * There's nothing to click and nothing to browse, so it stays typographic and
 * quiet rather than pretending to be an interactive section.
 */
const AnimeStudiosSection: React.FC<AnimeStudiosSectionProps> = ({ studios }) => {
  if (isEmpty(studios)) return null;

  return (
    <section id="studios" className="z-3">
      <dl className="flex flex-col gap-1 border-t border-default-100 pt-4 sm:flex-row sm:items-baseline sm:gap-6">
        <dt className="text-[11px] font-semibold tracking-[0.16em] text-default-500 uppercase sm:w-28 sm:shrink-0">
          {studios.length === 1 ? "Studio" : "Studios"}
        </dt>
        <dd className="text-sm leading-relaxed text-balance text-foreground/80">
          {studios.map((studio) => studio.name).join(", ")}
        </dd>
      </dl>
    </section>
  );
};

export default AnimeStudiosSection;
