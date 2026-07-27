"use client";

import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { isSupabaseConfigured } from "@/utils/supabase/config";
import type { User } from "@supabase/supabase-js";

type AuthUserData = User & {
  username: string;
};

const useSupabaseUser = () => {
  // May be null when Supabase isn't configured. Memoized so the auth listener
  // below doesn't resubscribe on every render.
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  const query = useQuery<AuthUserData | null>({
    queryKey: ["supabase-user"],
    // Without credentials there is no session to fetch; resolve as guest rather
    // than letting the client constructor throw and take down the page.
    enabled: isSupabaseConfigured,
    queryFn: async () => {
      if (!supabase) return null;

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return null;

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      // Errors are returned, not surfaced. Five components call this hook, so
      // toasting from here fired danger toasts at arbitrary moments on any
      // page, detached from any user action. Presentation belongs to consumers.
      if (error) {
        console.error("[auth] Failed to fetch user:", error.message);
        return null;
      }

      if (!user) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      // Fall back to the email local-part so a missing profile row degrades to
      // "signed in without a display name" rather than silently appearing
      // signed out everywhere.
      return {
        ...user,
        username: profile?.username ?? user.email?.split("@")[0] ?? "Account",
      };
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey: ["supabase-user"] });
    });

    return () => subscription.unsubscribe();
  }, [supabase, queryClient]);

  return query;
};

export default useSupabaseUser;
