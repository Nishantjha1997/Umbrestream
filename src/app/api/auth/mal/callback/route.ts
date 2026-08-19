import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { encryptOAuthToken, isOAuthConfigured, oauthRedirectUri, OAUTH_COOKIE_NAMES, safeReturnPath } from "@/lib/anime/oauth";

export const runtime = "nodejs";

function redirect(origin: string, next: string, error?: string) {
  const suffix = error ? `?anime_error=${encodeURIComponent(error)}` : "?anime_connected=mal";
  return NextResponse.redirect(`${origin}${next}${suffix}`);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get(OAUTH_COOKIE_NAMES.mal)?.value;
  let stored: { state?: string; verifier?: string; next?: string } = {};
  try { stored = rawCookie ? JSON.parse(rawCookie) as typeof stored : {}; } catch { stored = {}; }
  const next = safeReturnPath(stored.next ?? "/space");
  cookieStore.delete(OAUTH_COOKIE_NAMES.mal);
  if (!code || !state || state !== stored.state || !stored.verifier || !isOAuthConfigured("mal")) return redirect(origin, next, "mal_authorization_failed");

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect(origin, "/auth", "sign_in_required");
    const form = new URLSearchParams({
      client_id: process.env.MAL_CLIENT_ID!,
      code,
      code_verifier: stored.verifier,
      grant_type: "authorization_code",
      redirect_uri: oauthRedirectUri("mal"),
    });
    const tokenResponse = await fetch("https://myanimelist.net/v1/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: form,
      cache: "no-store",
    });
    if (!tokenResponse.ok) return redirect(origin, next, "mal_token_exchange_failed");
    const token = await tokenResponse.json() as { access_token?: string; refresh_token?: string; expires_in?: number };
    if (!token.access_token) return redirect(origin, next, "mal_token_missing");
    const profileResponse = await fetch("https://api.myanimelist.net/v2/users/@me", {
      headers: { Authorization: `Bearer ${token.access_token}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!profileResponse.ok) return redirect(origin, next, "mal_profile_failed");
    const profile = await profileResponse.json() as { id?: number; name?: string };
    if (!profile.id) return redirect(origin, next, "mal_profile_failed");
    const { error } = await supabase.from("anime_linked_accounts").upsert({
      user_id: user.id,
      provider: "mal",
      provider_user_id: String(profile.id),
      provider_username: profile.name ?? null,
      access_token_ciphertext: encryptOAuthToken(token.access_token),
      refresh_token_ciphertext: token.refresh_token ? encryptOAuthToken(token.refresh_token) : null,
      expires_at: token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : null,
    }, { onConflict: "user_id,provider" });
    if (error) {
      console.error("[anime-oauth] MAL account save failed:", error.code ?? "unknown");
      return redirect(origin, next, "mal_account_save_failed");
    }
    return redirect(origin, next);
  } catch (error) {
    console.error("[anime-oauth] MAL callback failed:", error);
    return redirect(origin, next, "mal_unavailable");
  }
}
