import { createHash } from "node:crypto";
import { SITE_URL } from "@/config/brand";
import { createPkceChallenge, createPkceVerifier, randomState } from "./oauth";

export type NativeAnimeProvider = "anilist" | "mal";

export const NATIVE_ANIME_RETURN_URI = "streamfree://anime-link";

export function nativeAnimeCallbackUri(provider: NativeAnimeProvider): string {
  return `${SITE_URL}/api/mobile/anime-links/callback/${provider}`;
}

export function hashNativeOAuthState(state: string): string {
  return createHash("sha256").update(state).digest("hex");
}

export function createNativeAnimeAuthorization(provider: NativeAnimeProvider) {
  const state = randomState();
  const verifier = provider === "mal" ? createPkceVerifier() : null;
  const redirectUri = nativeAnimeCallbackUri(provider);
  const params = new URLSearchParams({
    response_type: "code",
    client_id: provider === "anilist" ? process.env.ANILIST_CLIENT_ID ?? "" : process.env.MAL_CLIENT_ID ?? "",
    redirect_uri: redirectUri,
    state,
  });
  if (provider === "mal" && verifier) {
    params.set("code_challenge", createPkceChallenge(verifier));
    params.set("code_challenge_method", "S256");
  }
  return { state, verifier, redirectUri, authorizationUrl: provider === "anilist"
    ? `https://anilist.co/api/v2/oauth/authorize?${params}`
    : `https://myanimelist.net/v1/oauth2/authorize?${params}` };
}
