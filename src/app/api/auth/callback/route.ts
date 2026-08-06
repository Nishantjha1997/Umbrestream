import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const GET = async (request: Request) => {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Same resolve-and-compare rule as /api/auth/confirm. `${origin}${next}` keeps
  // the result on-origin today, but that is an accident of string concatenation,
  // not a check — one refactor to `NextResponse.redirect(next)` would turn this
  // into an open redirect.
  const requestedNext = searchParams.get("next");
  let next = "/";
  if (requestedNext) {
    try {
      const url = new URL(requestedNext, origin);
      if (url.origin === origin) next = `${url.pathname}${url.search}${url.hash}`;
    } catch {
      next = "/";
    }
  }

  if (code) {
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Insert username
      if (user) {
        // Was `console.info({ user })` — the whole Supabase user object, i.e. the
        // email address, provider identity payload and raw Google metadata of
        // every person who signs in, written to the platform log on each login.
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();

        if (!profile) {
          // Get base username dari Google
          const baseUsername =
            user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0];

          // Function buat generate unique username
          const generateUniqueUsername = async (base: string) => {
            let username = base;
            let attempts = 0;
            const maxAttempts = 5; // Prevent infinite loop

            while (attempts < maxAttempts) {
              // Check if username exists
              const { data: existing } = await supabase
                .from("profiles")
                .select("username")
                .eq("username", username)
                .single();

              if (!existing) {
                // Username available!
                return username;
              }

              // Username taken, add random 4 digits
              const randomNum = Math.floor(1000 + Math.random() * 9000); // 1000-9999
              username = `${base}#${randomNum}`;
              attempts++;
            }

            // Fallback: use timestamp if still can't find unique
            return `${base}${Date.now()}`;
          };

          // Generate unique username
          const uniqueUsername = await generateUniqueUsername(baseUsername);

          // Insert profile with unique username
          const { error: profileError } = await supabase.from("profiles").insert({
            id: user.id,
            username: uniqueUsername,
          });

          if (profileError) {
            console.error("Profile creation error:", profileError.code ?? profileError.message);
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=true`);
};
