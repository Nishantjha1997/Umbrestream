import { buildHomeFeed } from "@/lib/homeFeed/builder";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function corsHeaders(isPrivate: boolean): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
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
  const country =
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry") ??
    request.headers.get("x-country-code");
  const feed = await buildHomeFeed({ accessToken, country });
  return NextResponse.json(feed, { headers: corsHeaders(Boolean(accessToken)) });
}
