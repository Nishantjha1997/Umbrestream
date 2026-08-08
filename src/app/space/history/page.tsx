import { siteConfig } from "@/config/site";
import { Metadata, NextPage } from "next/types";
import { cache, Suspense } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/utils/supabase/server";
const UnauthorizedNotice = dynamic(() => import("@/components/ui/notice/Unauthorized"));
const WatchHistory = dynamic(() => import("@/components/sections/Space/WatchHistory"));

export const metadata: Metadata = {
  title: `Watch History | ${siteConfig.name}`,
};

const getUser = cache(async () => {
  // This runs during prerender, so an unconfigured or unreachable Supabase must
  // resolve to "not signed in" — the page already renders UnauthorizedNotice for
  // that case. Letting it throw fails the whole build instead.
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    return { user, error };
  } catch (error) {
    console.error("[space/history] Could not resolve user:", error);
    return { user: null, error };
  }
});

const WatchHistoryPage: NextPage = async () => {
  const { user, error } = await getUser();

  return (
    <Suspense>
      {error || !user ? (
        <UnauthorizedNotice
          title="Sign in to see your watch history"
          description="Create a free account to track what you've watched and how much time you've spent watching it."
        />
      ) : (
        <WatchHistory />
      )}
    </Suspense>
  );
};

export default WatchHistoryPage;
