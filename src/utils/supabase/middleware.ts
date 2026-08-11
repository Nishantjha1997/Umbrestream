import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "../env";
import { isSupabaseConfigured } from "./config";

const PROTECTED_PATHS = env.PROTECTED_PATHS?.split(",").filter(Boolean) ?? [];

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request });

  // This middleware matches nearly every route, so anything thrown here 500s
  // the whole site — including pages that don't need auth at all. Missing or
  // broken Supabase config must degrade to "nobody is signed in", never to an
  // unrenderable app. (A missing env var previously took down every page with
  // a bare "Internal Server Error".)
  if (!isSupabaseConfigured) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[auth] Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / " +
          "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY). Auth is disabled and " +
          "protected routes are open. Set them in your environment.",
      );
    }
    return supabaseResponse;
  }

  let response = supabaseResponse;

  try {
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    const redirectTo = (to: string) => {
      const url = request.nextUrl.clone();
      url.pathname = to;
      const redirectRes = NextResponse.redirect(url);
      response.cookies.getAll().forEach((cookie) => {
        redirectRes.cookies.set(cookie.name, cookie.value, cookie);
      });
      return redirectRes;
    };

    // Recovery links may carry the temporary session in the URL fragment,
    // which is invisible to server middleware. Let the browser hydrate this
    // page before checking authentication.
    const isPasswordRecoveryPath = pathname === "/auth/reset-password";
    if (
      !user &&
      !isPasswordRecoveryPath &&
      PROTECTED_PATHS.some((url) => pathname.startsWith(url))
    ) {
      return redirectTo("/auth");
    }

    // Already signed in -> no reason to sit on the auth screen.
    if (user && pathname === "/auth") {
      return redirectTo("/");
    }

    return response;
  } catch (error) {
    // Network blip, Supabase outage, malformed credentials: serve the page
    // signed-out rather than failing the request.
    console.error("[auth] Session refresh failed; continuing unauthenticated:", error);
    return response;
  }
}
