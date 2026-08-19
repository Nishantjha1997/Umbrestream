import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { SITE_URL } from "@/config/brand";

export type AnimeOAuthProvider = "anilist" | "mal";

export const OAUTH_COOKIE_NAMES: Record<AnimeOAuthProvider, string> = {
  anilist: "streamfree-anilist-oauth",
  mal: "streamfree-mal-oauth",
};

export function oauthRedirectUri(provider: AnimeOAuthProvider): string {
  // Allow pinning the exact callback URL via env (e.g. ANILIST_REDIRECT_URI),
  // independent of the build-time-inlined NEXT_PUBLIC_SITE_URL. AniList
  // requires this to match the registered app callback exactly, so an explicit
  // override removes an entire class of silent redirect_uri mismatches.
  const override = process.env[`${provider.toUpperCase()}_REDIRECT_URI`];
  if (override) return override.replace(/\/+$/, "");
  return `${SITE_URL}/api/auth/${provider}/callback`;
}

export function isOAuthConfigured(provider: AnimeOAuthProvider): boolean {
  const encryptionReady = Boolean(
    process.env.OAUTH_TOKEN_ENCRYPTION_KEY ||
    process.env.ANILIST_CLIENT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
  if (provider === "anilist") {
    return Boolean(process.env.ANILIST_CLIENT_ID && process.env.ANILIST_CLIENT_SECRET && encryptionReady);
  }
  return Boolean(process.env.MAL_CLIENT_ID && encryptionReady);
}

export function randomState(): string {
  return randomBytes(32).toString("base64url");
}

export function createPkceVerifier(): string {
  return randomBytes(48).toString("base64url");
}

export function createPkceChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

/** AES-GCM envelope: version.iv.tag.ciphertext, all base64url encoded. */
export function encryptOAuthToken(token: string): string {
  const secretSeed =
    process.env.OAUTH_TOKEN_ENCRYPTION_KEY ||
    process.env.ANILIST_CLIENT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "streamfree-default-oauth-key-seed";
  const key = createHash("sha256").update(secretSeed).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return ["v1", iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString("base64url")).join(".");
}

export function safeReturnPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/space";
  return value;
}
