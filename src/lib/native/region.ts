export const REGION_OPTIONS = [
  ["", "Automatic"],
  ["US", "United States"],
  ["IN", "India"],
  ["GB", "United Kingdom"],
  ["CA", "Canada"],
  ["AU", "Australia"],
  ["DE", "Germany"],
  ["FR", "France"],
  ["JP", "Japan"],
  ["KR", "South Korea"],
  ["BR", "Brazil"],
  ["MX", "Mexico"],
  ["SG", "Singapore"],
  ["AE", "United Arab Emirates"],
] as const;

export type RegionCode = (typeof REGION_OPTIONS)[number][0];

export function normalizeRegionOverride(value: unknown): Exclude<RegionCode, ""> | "" {
  const code = String(value || "").trim().toUpperCase();
  return REGION_OPTIONS.some(([option]) => option === code) && code ? (code as Exclude<RegionCode, "">) : "";
}

export function regionName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code;
  } catch {
    return code;
  }
}
