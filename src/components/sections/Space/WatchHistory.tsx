"use client";

/**
 * `/space/history` — the Account watch-history + analytics view. Stat tiles
 * come from `getWatchTimeSummary()` (the accumulated ledger `syncHistory`
 * maintains, not a sum of `last_position` — see that action's doc comment
 * for why summing positions would undercount rewatches). The list below is
 * every history row, completed included, mirroring `/space`'s own tile
 * styling for a consistent Account look.
 */

import { getUserHistories, getWatchTimeSummary } from "@/actions/histories";
import HistoryItemActions from "@/components/ui/button/HistoryItemActions";
import InlineRetry from "@/components/ui/feedback/InlineRetry";
import useSupabaseUser from "@/hooks/useSupabaseUser";
import type { MediaKind } from "@/types/media";
import { formatWatchTime, getImageUrl } from "@/utils/movies";
import { Chip, Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

const TYPE_LABEL: Record<MediaKind, string> = {
  movie: "Movies",
  tv: "TV Shows",
  anime: "Anime",
};

const SUMMARY_TYPES: MediaKind[] = ["movie", "tv", "anime"];

export default function WatchHistory() {
  const { data: user, isLoading: isUserLoading } = useSupabaseUser();

  const { data: summaryResponse, refetch: refetchSummary } = useQuery({
    queryKey: ["watch-time-summary", user?.id],
    queryFn: () => getWatchTimeSummary(),
    enabled: !isUserLoading,
  });

  const {
    data: historyResponse,
    isLoading: isHistoryLoading,
    isError: isHistoryError,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ["watch-history", user?.id],
    queryFn: () => getUserHistories(),
    enabled: !isUserLoading,
  });

  const summary = summaryResponse?.success ? summaryResponse.data : undefined;
  const historyFailed = isHistoryError || (Boolean(historyResponse) && !historyResponse?.success);
  const history = historyResponse?.success ? historyResponse.data ?? [] : [];

  return (
    <div className="mx-auto max-w-5xl pt-6 pb-28 md:pt-12 md:pb-12">
      <p className="text-xs font-semibold tracking-[0.24em] text-violet-300 uppercase">
        Your StreamFree
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
        Watch History
      </h1>
      <p className="mt-4 max-w-xl text-white/70">
        Everything you&apos;ve watched, and how much time you&apos;ve spent watching it.
      </p>

      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SUMMARY_TYPES.map((type) => (
          <div key={type} className="rounded-2xl border border-white/8 bg-white/[0.035] p-5">
            <p className="text-sm text-white/70">{TYPE_LABEL[type]}</p>
            <p className="mt-2 text-2xl font-semibold">{formatWatchTime(summary?.[type] ?? 0)}</p>
          </div>
        ))}
        <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 p-5">
          <p className="text-sm text-white/70">Total</p>
          <p className="mt-2 text-2xl font-semibold">{formatWatchTime(summary?.total ?? 0)}</p>
        </div>
      </div>

      <h2 className="mt-12 text-xl font-semibold">All titles</h2>
      <div className="mt-4 flex flex-col gap-2">
        {isHistoryLoading ? (
          <Spinner size="lg" variant="simple" className="mt-10 self-center" />
        ) : historyFailed ? (
          <InlineRetry
            message="Couldn't load watch history."
            onRetry={() => {
              void refetchHistory();
              void refetchSummary();
            }}
            className="mt-4"
          />
        ) : history.length === 0 ? (
          <p className="mt-4 text-white/70">Nothing watched yet.</p>
        ) : (
          history.map((item) => {
            const kind = item.type as MediaKind;
            return (
              <div
                key={`${item.type}-${item.media_id}-${item.season}-${item.episode}`}
                className="flex items-center gap-4 rounded-xl border border-white/8 bg-white/[0.02] p-3"
              >
                <Link
                  href={`/${kind}/${item.media_id}`}
                  className="relative h-[68px] w-[46px] flex-none overflow-hidden rounded-lg"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getImageUrl(item.poster_path || item.backdrop_path || "", "poster")}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 size-full object-cover"
                  />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="truncate text-sm font-medium text-white">{item.title}</p>
                  <p className="truncate text-xs text-white/70">
                    {TYPE_LABEL[kind]}
                    {kind !== "movie" ? ` · S${item.season} E${item.episode}` : ""}
                  </p>
                </div>
                <Chip size="sm" variant="faded" color={item.completed ? "success" : "default"}>
                  {formatWatchTime(item.total_watched_seconds)} watched
                </Chip>
                <HistoryItemActions
                  mediaId={item.media_id}
                  type={kind}
                  season={item.season}
                  episode={item.episode}
                  title={item.title}
                  completed={item.completed}
                  className="flex flex-none gap-1"
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
