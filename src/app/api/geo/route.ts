import { headers } from "next/headers";
import { NextResponse } from "next/server";

const COUNTRY_NAMES = new Intl.DisplayNames(["en"], { type: "region" });

function normalizeCountry(value: string | null): string | null {
  const country = value?.trim().toUpperCase();
  return country && /^[A-Z]{2}$/.test(country) ? country : null;
}

export async function GET() {
  const requestHeaders = await headers();
  const country =
    normalizeCountry(requestHeaders.get("x-vercel-ip-country")) ??
    normalizeCountry(requestHeaders.get("cf-ipcountry")) ??
    normalizeCountry(requestHeaders.get("x-country-code"));

  const languageCountry = requestHeaders
    .get("accept-language")
    ?.match(/[-_]([A-Z]{2})\b/i)?.[1];
  const resolvedCountry = country ?? normalizeCountry(languageCountry ?? null) ?? "US";

  return NextResponse.json(
    {
      country: resolvedCountry,
      countryName: COUNTRY_NAMES.of(resolvedCountry) ?? resolvedCountry,
      source: country ? "edge" : languageCountry ? "language" : "default",
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
