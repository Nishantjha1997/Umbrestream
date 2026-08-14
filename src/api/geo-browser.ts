export interface GeoRegion {
  country: string;
  countryName: string;
  source: "edge" | "language" | "default";
}

let regionPromise: Promise<GeoRegion> | null = null;

export function getBrowserRegion(): Promise<GeoRegion> {
  regionPromise ??= fetch("/api/geo", { next: { revalidate: 86_400 } })
    .then((response) => {
      if (!response.ok) throw new Error(`Geo lookup failed: ${response.status}`);
      return response.json() as Promise<GeoRegion>;
    })
    .catch(() => ({ country: "US", countryName: "Global", source: "default" as const }));

  return regionPromise;
}
