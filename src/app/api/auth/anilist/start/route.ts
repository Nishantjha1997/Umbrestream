import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SITE_URL } from "@/config/brand";
import { createClient } from "@/utils/supabase/server";
import { isOAuthConfigured, oauthRedirectUri, OAUTH_COOKIE_NAMES, randomState, safeReturnPath } from "@/lib/anime/oauth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin || SITE_URL;
  const next = safeReturnPath(new URL(request.url).searchParams.get("next"));
  if (!isOAuthConfigured("anilist")) {
    return NextResponse.redirect(`${origin}${next}?anime_error=anilist_not_configured`);
  }
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.redirect(`${origin}/auth?next=${encodeURIComponent(next)}`);

    const state = randomState();
    const cookieStore = await cookies();
    cookieStore.set(OAUTH_COOKIE_NAMES.anilist, JSON.stringify({ state, next }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    const params = new URLSearchParams({
      client_id: process.env.ANILIST_CLIENT_ID!,
      redirect_uri: oauthRedirectUri("anilist"),
      response_type: "code",
      state,
    });
    return NextResponse.redirect(`https://anilist.co/api/v2/oauth/authorize?${params}`);
  } catch (error) {
    console.error("[anime-oauth] AniList start failed:", error);
    return NextResponse.redirect(`${origin}${next}?anime_error=anilist_unavailable`);
  }
}
