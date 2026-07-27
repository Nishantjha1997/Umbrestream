"use client";

import { animeQueryLists } from "@/config/anime-lists";
import dynamic from "next/dynamic";
const MediaRow = dynamic(() => import("@/components/media/MediaRow"));

/**
 * Client-side row mapper for the anime home page.
 *
 * This wrapper exists for a structural reason, not stylistic: each row config
 * carries a `query` *function*, and functions cannot cross the server ->
 * client boundary as props. Importing `animeQueryLists` here — inside the
 * client boundary — keeps those closures client-side. Mapping them in the
 * Server Component instead fails the build with "Functions cannot be passed
 * directly to Client Components". Mirrors @/components/sections/Home/List.tsx.
 */
const AnimePageList: React.FC = () => {
  return (
    <div className="flex flex-col gap-3 md:gap-8">
      {animeQueryLists.map((list, i) => (
        <MediaRow key={list.name} kind="anime" priority={i === 0} {...list} />
      ))}
    </div>
  );
};

export default AnimePageList;
