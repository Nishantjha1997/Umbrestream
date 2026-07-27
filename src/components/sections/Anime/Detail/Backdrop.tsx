"use client";

import { Image } from "@heroui/image";
import { useWindowScroll } from "@mantine/hooks";
import { AniListMediaDetail } from "@/types/anilist";
import { isEmpty } from "@/utils/helpers";

interface AnimeBackdropSectionProps {
  anime: AniListMediaDetail;
}

/**
 * Visual treatment mirrors @/components/sections/Movie/Detail/Backdrop.tsx:
 * full-width image with top/bottom gradient fade into the page background,
 * fading further to opaque as the user scrolls past it.
 *
 * AniList has no separate wordmark/logo art (unlike TMDB's `images.logos`),
 * so unlike the movie/tv backdrops there's no title image overlay here — the
 * title itself is rendered by the Overview section below.
 */
const AnimeBackdropSection: React.FC<AnimeBackdropSectionProps> = ({ anime }) => {
  const [{ y }] = useWindowScroll();
  const opacity = Math.min((y / 1000) * 2, 1);
  const title = anime.title.english ?? anime.title.romaji ?? anime.title.native ?? "Untitled";
  const backdropImage =
    anime.bannerImage ?? anime.coverImage.extraLarge ?? anime.coverImage.large ?? undefined;

  return (
    <section id="backdrop" className="fixed inset-0 h-[35vh] md:h-[50vh] lg:h-[70vh]">
      <div className="absolute inset-0 z-10 bg-background" style={{ opacity: opacity }} />
      <div className="absolute inset-0 z-2 bg-linear-to-b from-background from-1% via-transparent via-30%" />
      <div className="absolute inset-0 z-2 translate-y-px bg-linear-to-t from-background from-1% via-transparent via-55%" />
      {!isEmpty(backdropImage) ? (
        <Image
          radius="none"
          alt={title}
          className="z-0 h-[35vh] w-screen object-cover object-center md:h-[50vh] lg:h-[70vh]"
          src={backdropImage}
        />
      ) : (
        <div
          className="z-0 h-[35vh] w-screen bg-secondary-100 md:h-[50vh] lg:h-[70vh]"
          style={anime.coverImage.color ? { backgroundColor: anime.coverImage.color } : undefined}
        />
      )}
    </section>
  );
};

export default AnimeBackdropSection;
