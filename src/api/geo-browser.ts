export interface GeoRegion {
  country: string;
  countryName: string;
  source: "edge" | "language" | "override" | "default";
  detectedCountry?: string;
}

export const REGION_OVERRIDE_STORAGE_KEY = "streamfree-region-override-v1";
const regionPromises = new Map<string, Promise<GeoRegion>>();

const VALID_REGION_CODES = new Set([
  "US", "IN", "GB", "CA", "AU", "DE", "FR", "JP", "KR", "BR", "MX", "SG", "AE",
]);

function normalizeRegion(value: string | null | undefined): string | null {
  const code = value?.trim().toUpperCase() ?? "";
  return VALID_REGION_CODES.has(code) ? code : null;
}

function displayRegionName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function getRegionOverride(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return normalizeRegion(window.localStorage.getItem(REGION_OVERRIDE_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function setRegionOverride(country: string | null): void {
  if (typeof window === "undefined") return;
  const normalized = normalizeRegion(country);
  try {
    if (normalized) window.localStorage.setItem(REGION_OVERRIDE_STORAGE_KEY, normalized);
    else window.localStorage.removeItem(REGION_OVERRIDE_STORAGE_KEY);
  } catch {
    // A blocked storage implementation should not break discovery.
  }
  regionPromises.clear();
  window.dispatchEvent(new CustomEvent("streamfree-region-change"));
}

export function getBrowserRegion(): Promise<GeoRegion> {
  const override = getRegionOverride();
  const cacheKey = override ?? "automatic";
  const cached = regionPromises.get(cacheKey);
  if (cached) return cached;

  const promise = fetch("/api/geo", { next: { revalidate: 86_400 } })
    .then((response) => {
      if (!response.ok) throw new Error(`Geo lookup failed: ${response.status}`);
      return response.json() as Promise<GeoRegion>;
    })
    .then((region) => override
      ? {
          ...region,
          detectedCountry: region.country,
          country: override,
          countryName: displayRegionName(override),
          source: "override" as const,
        }
      : region)
    .catch(() => {
      const country = override ?? "US";
      return {
        country,
        countryName: country === "US" && !override ? "Global" : displayRegionName(country),
        source: override ? "override" as const : "default" as const,
        detectedCountry: override ? "US" : undefined,
      };
    });

  regionPromises.set(cacheKey, promise);
  return promise;
}
