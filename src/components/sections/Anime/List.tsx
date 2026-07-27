"use client";

import { animeQueryLists } from "@/config/anime-lists";
import dynamic from "next/dynamic";
const AnimeHomeList = dynamic(() => import("@/components/sections/Anime/HomeList"));

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
      {animeQueryLists.map((list) => (
        <AnimeHomeList key={list.name} {...list} />
      ))}
    </div>
  );
};

export default AnimePageList;
