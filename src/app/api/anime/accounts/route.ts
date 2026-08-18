import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { isOAuthConfigured, type AnimeOAuthProvider } from "@/lib/anime/oauth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ authenticated: false, providers: {} }, { status: 401 });
    const { data, error } = await supabase
      .from("anime_linked_accounts")
      .select("provider, provider_username, updated_at")
      .eq("user_id", user.id);
    if (error) throw error;
    const linked = new Set((data ?? []).map((row) => row.provider));
    const providers = (['anilist', 'mal'] as AnimeOAuthProvider[]).reduce<Record<string, unknown>>((result, provider) => {
      result[provider] = { configured: isOAuthConfigured(provider), connected: linked.has(provider) };
      return result;
    }, {});
    return NextResponse.json({ authenticated: true, providers, accounts: data ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[anime-oauth] account status failed:", error);
    return NextResponse.json({ authenticated: false, providers: {} }, { status: 503 });
  }
}
