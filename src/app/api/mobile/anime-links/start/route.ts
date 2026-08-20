import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { isOAuthConfigured } from "@/lib/anime/oauth";
import { createNativeAnimeAuthorization, hashNativeOAuthState, type NativeAnimeProvider } from "@/lib/anime/nativeOauth";

export const runtime = "nodejs";

function providerValue(value: string | null): NativeAnimeProvider | null {
  return value === "anilist" || value === "mal" ? value : null;
}

export async function GET(request: Request) {
  const provider = providerValue(new URL(request.url).searchParams.get("provider"));
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!provider || !token) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!isOAuthConfigured(provider) || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.OAUTH_TOKEN_ENCRYPTION_KEY) {
    return NextResponse.json({ error: "Anime account linking is temporarily unavailable." }, { status: 503 });
  }

  try {
    const userClient = await createClient(false, token);
    const { data: { user } } = await userClient.auth.getUser(token);
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const authorization = createNativeAnimeAuthorization(provider);
    const admin = await createClient(true);
    const { error } = await admin.from("anime_oauth_transactions").insert({
      state_hash: hashNativeOAuthState(authorization.state),
      user_id: user.id,
      provider,
      code_verifier: authorization.verifier,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
    if (error) throw error;

    return NextResponse.json(
      { provider, authorizationUrl: authorization.authorizationUrl },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[native-anime-oauth] start failed:", error);
    return NextResponse.json({ error: "Anime account linking is temporarily unavailable." }, { status: 503 });
  }
}
