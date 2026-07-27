import Link from "next/link";
import { Chip, Image } from "@heroui/react";
import { AniListMediaSummary } from "@/types/anilist";
import Carousel from "@/components/ui/wrapper/Carousel";
import SectionTitle from "@/components/ui/other/SectionTitle";
import Rating from "@/components/ui/other/Rating";
import { isEmpty } from "@/utils/helpers";

const FALLBACK_POSTER = "https://dancyflix.com/placeholder.png";

/**
 * No shared Anime poster card exists yet at the time this was written (that's
 * owned by whichever page builds the anime browse grid, under
 * @/components/sections/Anime/Cards/Poster.tsx if/when it lands). This is a
 * small self-contained card scoped to the recommendations row only, so it
 * doesn't block on — or collide with — that work. Visually it mirrors
 * @/components/sections/Movie/Cards/Poster.tsx's "full" variant, minus the
 * hover-preview/long-press affordances that need a second network fetch.
 */
const RecommendationCard: React.FC<{ anime: AniListMediaSummary }> = ({ anime }) => {
  const title = anime.title.english ?? anime.title.romaji ?? anime.title.native ?? "Untitled";
  const posterImage =
    anime.coverImage.large ?? anime.coverImage.extraLarge ?? anime.coverImage.medium ?? FALLBACK_POSTER;

  return (
    <Link href={`/anime/${anime.id}`}>
      <div className="group motion-preset-focus relative aspect-2/3 overflow-hidden rounded-lg border-[3px] border-transparent text-white transition-colors hover:border-secondary">
        {anime.isAdult && (
          <Chip color="danger" size="sm" variant="flat" className="absolute left-2 top-2 z-20">
            18+
          </Chip>
        )}
        <div className="absolute bottom-0 z-2 h-1/2 w-full bg-linear-to-t from-black from-1%"></div>
        <div className="absolute bottom-0 z-3 flex w-full flex-col gap-1 px-4 py-3">
          <h6 className="truncate text-sm font-semibold">{title}</h6>
          <div className="flex justify-between text-xs">
            <p>{anime.seasonYear ?? "N/A"}</p>
            <Rating rate={(anime.averageScore ?? 0) / 10} />
          </div>
        </div>
        <Image
          alt={title}
          src={posterImage}
          radius="none"
          className="z-0 aspect-2/3 h-[250px] object-cover object-center transition group-hover:scale-110 md:h-[300px]"
          classNames={{ img: "group-hover:opacity-70" }}
        />
      </div>
    </Link>
  );
};

interface AnimeRelatedSectionProps {
  recommendations: AniListMediaSummary[];
}

const AnimeRelatedSection: React.FC<AnimeRelatedSectionProps> = ({ recommendations }) => {
  if (isEmpty(recommendations)) return null;

  return (
    <section id="related" className="z-3 flex flex-col gap-2">
      <SectionTitle color="secondary" className="mb-2 sm:mb-0">
        You May Also Like
      </SectionTitle>
      <Carousel>
        {recommendations.map((anime) => (
          <div key={anime.id} className="flex min-h-fit max-w-fit items-center px-1 py-2">
            <RecommendationCard anime={anime} />
          </div>
        ))}
      </Carousel>
    </section>
  );
};

export default AnimeRelatedSection;
