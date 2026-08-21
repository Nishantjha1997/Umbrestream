import type { AniListMediaDetail, AniListMediaRelation } from "@/types/anilist";

const SEASON_FORMATS = new Set(["TV", "TV_SHORT", "ONA"]);

export interface AnimeSeasonOption {
  id: number;
  label: string;
  relation: "previous" | "current" | "next";
}

export interface AnimeEpisodeProgress {
  completed: boolean;
  percent: number;
}

interface EpisodeHistoryLike {
  episode: number;
  last_position: number;
  duration: number;
  completed: boolean;
}

export function animeTitle(anime: AniListMediaDetail | AniListMediaRelation["media"]): string {
  return anime.title.english ?? anime.title.romaji ?? anime.title.native ?? "Anime";
}

/** AniList seasons are separate media records. Only direct TV-like
 * prequel/sequel relationships are safe to present as season navigation. */
export function buildAnimeSeasonOptions(anime: AniListMediaDetail): AnimeSeasonOption[] {
  const related = anime.relations
    .filter(
      (relation) =>
        (relation.relationType === "PREQUEL" || relation.relationType === "SEQUEL") &&
        relation.media.format !== null &&
        SEASON_FORMATS.has(relation.media.format),
    )
    .map((relation) => ({
      id: relation.media.id,
      label: animeTitle(relation.media),
      relation: relation.relationType === "PREQUEL" ? ("previous" as const) : ("next" as const),
    }));

  const options: AnimeSeasonOption[] = [
    ...related.filter((option) => option.relation === "previous"),
    { id: anime.id, label: animeTitle(anime), relation: "current" },
    ...related.filter((option) => option.relation === "next"),
  ];

  return options.filter(
    (option, index) => options.findIndex((candidate) => candidate.id === option.id) === index,
  );
}

/** Never fabricate an episode count. For airing Anime the upcoming episode
 * establishes the last episode that has actually aired. */
export function getAnimeEpisodeCount(anime: AniListMediaDetail): number {
  if (anime.episodes !== null) return Math.max(0, anime.episodes);
  if (anime.nextAiringEpisode) return Math.max(0, anime.nextAiringEpisode.episode - 1);
  return 0;
}

export function buildAnimeEpisodeProgress(
  rows: EpisodeHistoryLike[],
): Map<number, AnimeEpisodeProgress> {
  const progress = new Map<number, AnimeEpisodeProgress>();
  for (const row of rows) {
    if (row.episode < 1) continue;
    const percent =
      row.duration > 0
        ? Math.min(100, Math.max(0, Math.round((row.last_position / row.duration) * 100)))
        : row.completed
          ? 100
          : 0;
    progress.set(row.episode, { completed: row.completed || percent >= 95, percent });
  }
  return progress;
}
