import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { encryptOAuthToken } from "@/lib/anime/oauth";
import { hashNativeOAuthState, nativeAnimeCallbackUri, type NativeAnimeProvider, NATIVE_ANIME_RETURN_URI } from "@/lib/anime/nativeOauth";

export const runtime = "nodejs";

function providerValue(value: string): NativeAnimeProvider | null {
  return value === "anilist" || value === "mal" ? value : null;
}

function finish(provider: string, status: "success" | "error", reason?: string) {
  const params = new URLSearchParams({ provider, status });
  if (reason) params.set("reason", reason);
  return NextResponse.redirect(`${NATIVE_ANIME_RETURN_URI}?${params}`);
}

export async function GET(request: Request, context: { params: Promise<{ provider: string }> }) {
  const provider = providerValue((await context.params).provider);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!provider || !code || !state || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.OAUTH_TOKEN_ENCRYPTION_KEY) {
    return finish(provider ?? "unknown", "error", "authorization_failed");
  }

  try {
    const admin = await createClient(true);
    const { data: transaction, error: transactionError } = await admin
      .from("anime_oauth_transactions")
      .select("state_hash, user_id, provider, code_verifier, expires_at")
      .eq("state_hash", hashNativeOAuthState(state))
      .eq("provider", provider)
      .maybeSingle();
    if (transactionError || !transaction || Date.parse(transaction.expires_at) <= Date.now()) {
      return finish(provider, "error", "state_expired");
    }
    const { error: deleteError } = await admin.from("anime_oauth_transactions").delete().eq("state_hash", transaction.state_hash);
    if (deleteError) return finish(provider, "error", "state_unavailable");

    const tokenResponse = provider === "anilist"
      ? await fetch("https://anilist.co/api/v2/oauth/token", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            grant_type: "authorization_code",
            client_id: process.env.ANILIST_CLIENT_ID,
            client_secret: process.env.ANILIST_CLIENT_SECRET,
            redirect_uri: nativeAnimeCallbackUri(provider),
            code,
          }),
          cache: "no-store",
        })
      : await fetch("https://myanimelist.net/v1/oauth2/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
          body: new URLSearchParams({
            client_id: process.env.MAL_CLIENT_ID ?? "",
            code,
            code_verifier: transaction.code_verifier ?? "",
            grant_type: "authorization_code",
            redirect_uri: nativeAnimeCallbackUri(provider),
          }),
          cache: "no-store",
        });
    if (!tokenResponse.ok) return finish(provider, "error", "token_exchange_failed");
    const token = await tokenResponse.json() as { access_token?: string; refresh_token?: string; expires_in?: number };
    if (!token.access_token) return finish(provider, "error", "token_missing");

    const profile = provider === "anilist"
      ? await fetch("https://graphql.anilist.co", {
          method: "POST",
          headers: { Authorization: `Bearer ${token.access_token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ query: "query { Viewer { id name } }" }),
          cache: "no-store",
        }).then(async (response) => response.ok ? (await response.json() as { data?: { Viewer?: { id?: number; name?: string } } }).data?.Viewer : null)
      : await fetch("https://api.myanimelist.net/v2/users/@me", {
          headers: { Authorization: `Bearer ${token.access_token}`, Accept: "application/json" },
          cache: "no-store",
        }).then(async (response) => response.ok ? await response.json() as { id?: number; name?: string } : null);
    if (!profile?.id) return finish(provider, "error", "profile_failed");

    const { error: saveError } = await admin.from("anime_linked_accounts").upsert({
      user_id: transaction.user_id,
      provider,
      provider_user_id: String(profile.id),
      provider_username: profile.name ?? null,
      access_token_ciphertext: encryptOAuthToken(token.access_token),
      refresh_token_ciphertext: token.refresh_token ? encryptOAuthToken(token.refresh_token) : null,
      expires_at: token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : null,
    }, { onConflict: "user_id,provider" });
    if (saveError) return finish(provider, "error", "account_save_failed");
    return finish(provider, "success");
  } catch (error) {
    console.error("[native-anime-oauth] callback failed:", error);
    return finish(provider ?? "unknown", "error", "unavailable");
  }
}
