import AnimeDetailContent from "@/components/sections/Anime/Detail/DetailContent";
import { anilistApi } from "@/api/anilist";
import { getImageUrl } from "@/utils/movies";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

async function fetchAnime(id: number) {
  try {
    return await anilistApi.details(id);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) return { title: "Anime" };
  const anime = await fetchAnime(numId);
  if (!anime) return { title: "Anime Details" };

  const title =
    anime.title.english ?? anime.title.romaji ?? anime.title.native ?? "Untitled";
  const description = anime.description?.slice(0, 200) || `Watch ${title} on StreamFree`;
  const posterUrl = getImageUrl(
    anime.coverImage.extraLarge ?? anime.coverImage.large ?? anime.coverImage.medium ?? undefined,
    "poster",
  );
  const backdropUrl = anime.bannerImage ?? undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        ...(backdropUrl ? [{ url: backdropUrl }] : []),
        ...(posterUrl ? [{ url: posterUrl }] : []),
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: backdropUrl ? [backdropUrl] : posterUrl ? [posterUrl] : [],
    },
  };
}

export default async function AnimeDetailPage({ params }: Props) {
  const { id } = await params;
  const numId = Number(id);
  const initialData = await fetchAnime(numId);
  return <AnimeDetailContent id={numId} initialData={initialData} />;
}
