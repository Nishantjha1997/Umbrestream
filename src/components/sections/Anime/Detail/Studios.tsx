import { Chip } from "@heroui/react";
import SectionTitle from "@/components/ui/other/SectionTitle";
import { AniListStudio } from "@/types/anilist";
import { isEmpty } from "@/utils/helpers";

interface AnimeStudiosSectionProps {
  studios: AniListStudio[];
}

/**
 * Fills the "Casts" slot in the detail-page layout. AniList's queried fields
 * don't include voice-cast data, so studios (the closest AniList equivalent
 * to a credited-people section) get their own section here instead, mirroring
 * @/components/sections/Movie/Detail/Casts.tsx structurally.
 */
const AnimeStudiosSection: React.FC<AnimeStudiosSectionProps> = ({ studios }) => {
  if (isEmpty(studios)) return null;

  return (
    <section id="studios" className="z-3 flex flex-col gap-3">
      <SectionTitle color="secondary">Studios</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {studios.map((studio) => (
          <Chip key={studio.id} size="lg" variant="flat" color="secondary" radius="full">
            {studio.name}
          </Chip>
        ))}
      </div>
    </section>
  );
};

export default AnimeStudiosSection;
