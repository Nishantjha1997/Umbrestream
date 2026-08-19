import type { HomeFeedResponseV1 } from "./types";

type NativeRequest = (
  path: string,
  options?: { headers?: Record<string, string> },
) => Promise<unknown>;

function isHomeFeedResponse(value: unknown): value is HomeFeedResponseV1 {
  if (!value || typeof value !== "object") return false;
  const feed = value as Partial<HomeFeedResponseV1>;
  return feed.schemaVersion === 1 && Array.isArray(feed.rows) && Boolean(feed.region)
    && typeof feed.generatedAt === "string";
}

export async function fetchSharedHomeFeed(
  request: NativeRequest,
  options: { accessToken?: string; regionOverride?: string } = {},
): Promise<HomeFeedResponseV1> {
  const headers: Record<string, string> = {};
  if (options.accessToken) headers.Authorization = `Bearer ${options.accessToken}`;
  if (options.regionOverride) headers["X-StreamFree-Region"] = options.regionOverride;

  const feed = await request("/api/mobile/home", { headers });
  if (!isHomeFeedResponse(feed)) throw new Error("Invalid home feed");
  return feed;
}
