import { buildHomeFeed } from "@/lib/homeFeed/builder";
import { decodeContinueWatchingCursor } from "@/lib/history/continueWatching";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function corsHeaders(isPrivate: boolean): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, X-StreamFree-Region",
    "Cache-Control": isPrivate
      ? "private, no-store"
      : "public, s-maxage=300, stale-while-revalidate=600",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders(false) });
}

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  const accessToken = authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  const detectedCountry =
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry") ??
    request.headers.get("x-country-code");
  const requestedOverride = request.headers.get("x-streamfree-region")?.trim().toUpperCase() ?? "";
  const countryOverride = /^[A-Z]{2}$/.test(requestedOverride) ? requestedOverride : undefined;
  const continueCursor = decodeContinueWatchingCursor(request.nextUrl.searchParams.get("continueCursor"));
  const feed = await buildHomeFeed({
    accessToken,
    country: detectedCountry,
    detectedCountry,
    countryOverride,
    countrySource: countryOverride ? "override" : undefined,
    continueCursor,
  });
  return NextResponse.json(feed, { headers: corsHeaders(Boolean(accessToken) || Boolean(countryOverride)) });
}
