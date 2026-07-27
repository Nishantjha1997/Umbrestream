import { siteConfig } from "@/config/site";
import { Metadata, NextPage } from "next/types";
import { cache, Suspense } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/utils/supabase/server";
const UnauthorizedNotice = dynamic(() => import("@/components/ui/notice/Unauthorized"));
const LibraryList = dynamic(() => import("@/components/sections/Library/List"));

export const metadata: Metadata = {
  title: `Library | ${siteConfig.name}`,
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
    console.error("[library] Could not resolve user:", error);
    return { user: null, error };
  }
});

const LibraryPage: NextPage = async () => {
  const { user, error } = await getUser();

  return (
    <Suspense>
      {error || !user ? (
        <UnauthorizedNotice
          title="Sign in to access your library"
          description="Create a free account to save your favorite movies and TV shows!"
        />
      ) : (
        <LibraryList />
      )}
    </Suspense>
  );
};

export default LibraryPage;
