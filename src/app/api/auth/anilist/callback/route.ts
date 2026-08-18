import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { encryptOAuthToken, isOAuthConfigured, oauthRedirectUri, OAUTH_COOKIE_NAMES, safeReturnPath } from "@/lib/anime/oauth";

export const runtime = "nodejs";

function redirect(origin: string, next: string, error?: string) {
  const suffix = error ? `?anime_error=${encodeURIComponent(error)}` : "?anime_connected=anilist";
  return NextResponse.redirect(`${origin}${next}${suffix}`);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get(OAUTH_COOKIE_NAMES.anilist)?.value;
  let stored: { state?: string; next?: string } = {};
  try { stored = rawCookie ? JSON.parse(rawCookie) as typeof stored : {}; } catch { stored = {}; }
  const next = safeReturnPath(stored.next ?? "/space");
  cookieStore.delete(OAUTH_COOKIE_NAMES.anilist);
  if (!code || !state || state !== stored.state || !isOAuthConfigured("anilist")) return redirect(origin, next, "anilist_authorization_failed");

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect(origin, "/auth", "sign_in_required");
    const tokenResponse = await fetch("https://anilist.co/api/v2/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: process.env.ANILIST_CLIENT_ID,
        client_secret: process.env.ANILIST_CLIENT_SECRET,
        redirect_uri: oauthRedirectUri("anilist"),
        code,
      }),
      cache: "no-store",
    });
    if (!tokenResponse.ok) return redirect(origin, next, "anilist_token_exchange_failed");
    const token = await tokenResponse.json() as { access_token?: string; expires_in?: number };
    if (!token.access_token) return redirect(origin, next, "anilist_token_missing");
    const viewerResponse = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { Authorization: `Bearer ${token.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: "query { Viewer { id name } }" }),
      cache: "no-store",
    });
    if (!viewerResponse.ok) return redirect(origin, next, "anilist_profile_failed");
    const viewerPayload = await viewerResponse.json() as { data?: { Viewer?: { id?: number; name?: string } } };
    const viewer = viewerPayload.data?.Viewer;
    if (!viewer?.id) return redirect(origin, next, "anilist_profile_failed");
    const { error } = await supabase.from("anime_linked_accounts").upsert({
      user_id: user.id,
      provider: "anilist",
      provider_user_id: String(viewer.id),
      provider_username: viewer.name ?? null,
      access_token_ciphertext: encryptOAuthToken(token.access_token),
      refresh_token_ciphertext: null,
      expires_at: token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : null,
    }, { onConflict: "user_id,provider" });
    if (error) {
      console.error("[anime-oauth] AniList account save failed:", error.code ?? "unknown");
      return redirect(origin, next, "anilist_account_save_failed");
    }
    return redirect(origin, next);
  } catch (error) {
    console.error("[anime-oauth] AniList callback failed:", error);
    return redirect(origin, next, "anilist_unavailable");
  }
}
