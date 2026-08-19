import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SITE_URL } from "@/config/brand";
import { createClient } from "@/utils/supabase/server";
import { createPkceChallenge, createPkceVerifier, isOAuthConfigured, OAUTH_COOKIE_NAMES, randomState, safeReturnPath } from "@/lib/anime/oauth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin || SITE_URL;
  const next = safeReturnPath(new URL(request.url).searchParams.get("next"));
  if (!isOAuthConfigured("mal")) return NextResponse.redirect(`${origin}${next}?anime_error=mal_not_configured`);
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.redirect(`${origin}/auth?next=${encodeURIComponent(next)}`);
    const state = randomState();
    const verifier = createPkceVerifier();
    const cookieStore = await cookies();
    cookieStore.set(OAUTH_COOKIE_NAMES.mal, JSON.stringify({ state, verifier, next }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    const params = new URLSearchParams({
      response_type: "code",
      client_id: process.env.MAL_CLIENT_ID!,
      code_challenge: createPkceChallenge(verifier),
      code_challenge_method: "S256",
      state,
    });
    return NextResponse.redirect(`https://myanimelist.net/v1/oauth2/authorize?${params}`);
  } catch (error) {
    console.error("[anime-oauth] MAL start failed:", error);
    return NextResponse.redirect(`${origin}${next}?anime_error=mal_unavailable`);
  }
}
