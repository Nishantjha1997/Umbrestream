"use client";

import { anilistApi } from "@/api/anilist";
import { Params } from "@/types";
import { Button, Card, Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { notFound, useRouter } from "next/navigation";
import { use } from "react";
import { NextPage } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "@/utils/icons";

const AnimePlayerPage: NextPage<Params<{ id: number; episode: number }>> = ({ params }) => {
  const { id, episode } = use(params);
  const router = useRouter();

  const { data: anime, isPending, error } = useQuery({
    queryFn: () => anilistApi.details(id),
    queryKey: ["anime-player-details", id],
  });

  if (isPending) {
    return <Spinner size="lg" className="absolute-center" variant="simple" />;
  }

  if (error || !anime) notFound();

  const title = anime.title.english ?? anime.title.romaji ?? anime.title.native ?? "Untitled";
  const episodeCount = anime.episodes;

  if (episodeCount && (episode < 1 || episode > episodeCount)) notFound();

  const hasPrev = episode > 1;
  const hasNext = episodeCount ? episode < episodeCount : true;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 py-10">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-default-500 text-sm">
          Episode {episode}
          {episodeCount ? ` of ${episodeCount}` : ""}
        </p>
      </div>

      {/*
        No source is wired here on purpose. This player intentionally has no
        built-in streaming source — see the movie/TV player if you want to
        understand why that's a deliberate line rather than an oversight.
      */}
      <Card className="flex aspect-video w-full flex-col items-center justify-center gap-3 border border-white/10 bg-white/5 p-8 text-center backdrop-blur-md">
        <p className="text-default-500 max-w-sm text-sm">
          No playback source is configured for anime episodes yet. Wire one up in{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5">
            src/app/anime/[id]/player/[episode]/page.tsx
          </code>
          .
        </p>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          isDisabled={!hasPrev}
          variant="flat"
          startContent={<ChevronLeft size={18} />}
          onPress={() => router.push(`/anime/${id}/player/${episode - 1}`)}
        >
          Previous
        </Button>
        <Button as={Link} href={`/anime/${id}`} variant="light">
          Back to details
        </Button>
        <Button
          isDisabled={!hasNext}
          variant="flat"
          endContent={<ChevronRight size={18} />}
          onPress={() => router.push(`/anime/${id}/player/${episode + 1}`)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default AnimePlayerPage;
