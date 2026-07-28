"use client";

import { getUserHistories } from "@/actions/histories";
import HomeEmptyState from "@/components/sections/Home/EmptyState";
import Carousel from "@/components/ui/wrapper/Carousel";
import useSupabaseUser from "@/hooks/useSupabaseUser";
import { Skeleton } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import ResumeCard from "./Cards/Resume";

/**
 * The resume rail.
 *
 * Previously `return null` on anything other than a populated history, so the
 * section was invisible to exactly the people who most needed to know it
 * exists — signed-out visitors and anyone who hasn't pressed play yet (§6).
 * The three states are now distinct: loading, "sign in and we'll remember",
 * and "start something and it lands here".
 */

const SKELETON_COUNT = 4;

const ContinueWatching: React.FC = () => {
  // `isLoading`, not `isPending`: useSupabaseUser disables itself when Supabase
  // has no credentials, and a disabled query reports `pending` forever — which
  // would pin this section on its skeleton permanently.
  const { data: user, isLoading: isUserLoading } = useSupabaseUser();

  const { data, isPending } = useQuery({
    // Keyed on the user so signing in or out re-resolves the rail instead of
    // serving the previous identity's history from cache.
    queryKey: ["continue-watching", user?.id],
    queryFn: () => getUserHistories(),
    // Without this the rail fires once against `undefined` and again the moment
    // the id resolves — two round trips per cold load, the second of which
    // replaces the first. Same gate as <Recommended>.
    enabled: !isUserLoading,
  });

  const histories = data?.success ? (data.data ?? []) : [];

  if (isUserLoading || isPending) {
    return (
      <section id="continue-watching" className="flex w-full flex-col gap-3" aria-busy="true">
        <Skeleton className="h-5 w-52 rounded-full md:h-6" />
        <div className="flex gap-2 overflow-hidden" aria-hidden="true">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <Skeleton
              key={`resume-skeleton-${i}`}
              className="aspect-video h-[150px] shrink-0 rounded-(--radius-card) md:h-[200px]"
            />
          ))}
        </div>
      </section>
    );
  }

  if (histories.length === 0) {
    return (
      <section id="continue-watching">
        <HomeEmptyState
          title="Continue Watching"
          headline={user ? "Nothing in progress" : "Pick up where you left off"}
          description={
            user
              ? "Start a title and it reappears here at the exact second you stopped."
              : "Sign in and Umbra keeps your place in everything you watch, on every device."
          }
          action={
            user
              ? { label: "Browse titles", href: "/discover" }
              : { label: "Sign in", href: "/auth" }
          }
        />
      </section>
    );
  }

  return (
    <section id="continue-watching" className="flex w-full flex-col gap-3">
      <div className="flex h-7 items-center md:h-8">
        <h2 className="text-lg font-semibold tracking-tight md:text-xl">Continue Watching</h2>
      </div>
      <Carousel>
        {histories.map((media) => (
          <div
            key={media.id}
            className="embla__slide flex min-h-fit max-w-fit items-center px-1 py-2"
          >
            <ResumeCard media={media} />
          </div>
        ))}
      </Carousel>
    </section>
  );
};

export default ContinueWatching;
