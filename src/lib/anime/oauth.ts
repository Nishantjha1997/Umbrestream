import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { SITE_URL } from "@/config/brand";

export type AnimeOAuthProvider = "anilist" | "mal";

export const OAUTH_COOKIE_NAMES: Record<AnimeOAuthProvider, string> = {
  anilist: "streamfree-anilist-oauth",
  mal: "streamfree-mal-oauth",
};

export function oauthRedirectUri(provider: AnimeOAuthProvider): string {
  return `${SITE_URL}/api/auth/${provider}/callback`;
}

export function isOAuthConfigured(provider: AnimeOAuthProvider): boolean {
  const encryptionReady = Boolean(process.env.OAUTH_TOKEN_ENCRYPTION_KEY);
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
  const key = createHash("sha256").update(process.env.OAUTH_TOKEN_ENCRYPTION_KEY ?? "").digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return ["v1", iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString("base64url")).join(".");
}

export function safeReturnPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/space";
  return value;
}
