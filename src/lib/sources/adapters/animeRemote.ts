import type { AudioVariant, MediaTrack, SourceAdapter, StreamCandidate, StreamKind } from "../types";
import { proxiedFetch, toProxiedUrl } from "../../../utils/proxy.ts";
import {
  isAllowedHttpsUrl,
  normalizeAllowedHttpsUrl,
  normalizeConfiguredHttpsBase,
  parseAllowedHttpsOrigins,
  type AllowedHttpsOrigins,
} from "../urlPolicy.ts";

const API_PROVIDERS = new Set([
  "reanime",
  "anikoto",
  "animegg",
  "anineko",
  "2dhive",
  "anizone",
  "animecg",
  "animenosub",
  "megaplay",
  "miruro",
  "mkissa",
  "anidbapp",
  "anibd",
  "senshi",
  "kickassanime",
  "kaa",
  "animedunya",
  // MiruroAPI provider keys. These are the provider variants returned by its
  // documented /api/episodes and /api/watch contracts.
  "kiwi",
  "pewe",
  "bee",
  "bonk",
  "bun",
  "ally",
  "nun",
  "twin",
  "cog",
  "moo",
  "hop",
  "telli",
]);

const IFRAME_ALLOW = "autoplay; encrypted-media; picture-in-picture; fullscreen; screen-wake-lock";
const animeRemoteCache = new Map<string, { expiresAt: number; data: StreamCandidate[] }>();
const REMOTE_CACHE_VERSION = "fanout-v2";
const DIRECT_WATCH_DEADLINE_MS = 12_000;
const ANIVEXA_DIRECT_PROVIDERS = [
  "anibd",
  "reanime",
  "anikoto",
  "animegg",
  "anineko",
  "2dhive",
  "anizone",
  "animecg",
  "animenosub",
  "megaplay",
  "mkissa",
  "senshi",
  "kickassanime",
  "kaa",
  "anidbapp",
  "animedunya",
] as const;

/** Resolves to { value } on success or null on timeout/rejection. */
function withDeadline<T>(promise: Promise<T>, ms: number): Promise<{ value: T } | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve({ value });
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
    );
  });
}

function allowedOrigins(): AllowedHttpsOrigins {
  return parseAllowedHttpsOrigins(process.env.STREAMFREE_ANIME_ALLOWED_ORIGINS);
}

function segment(value: unknown): string | null {
  return typeof value === "string" || typeof value === "number" ? encodeURIComponent(String(value)) : null;
}

function streamKind(value: unknown, url: string): StreamKind | null {
  const declared = typeof value === "string" ? value.toLowerCase() : "";
  if (declared === "hls" || declared === "m3u8" || declared === "hls-redirect") return "hls";
  if (declared === "dash" || declared === "mpd") return "dash";
  if (declared === "mp4") return "mp4";
  if (declared === "embed" || declared === "iframe") return "iframe";
  const path = url.split("?")[0].toLowerCase();
  if (path.endsWith(".m3u8")) return "hls";
  if (path.endsWith(".mpd")) return "dash";
  if (/\.(mp4|webm)(\?|$)/.test(path)) return "mp4";
  return "iframe";
}

function providerLabel(value: string): string {
  const labels: Record<string, string> = {
    reanime: "ReAnime",
    anikoto: "AniKoto",
    animegg: "AnimeGG",
    anineko: "AniNeko",
    "2dhive": "2DHive",
    anizone: "AniZone",
    animecg: "AnimeCG",
    animenosub: "AnimeNoSub",
    megaplay: "MegaPlay",
    anibd: "AniBD",
    mkissa: "MKissa",
    senshi: "Senshi",
    kickassanime: "KickAssAnime",
    kaa: "KickAssAnime",
    anidbapp: "AniDB",
    animedunya: "AnimeDunya",
    miruro: "Miruro",
    kiwi: "Miruro · Kiwi",
    pewe: "Miruro · Pewe",
    bee: "Miruro · Bee",
    bonk: "Miruro · Bonk",
    bun: "Miruro · Bun",
    ally: "Miruro · Ally",
    nun: "Miruro · Nun",
    twin: "Miruro · Twin",
    cog: "Miruro · Cog",
    moo: "Miruro · Moo",
    hop: "Miruro · Hop",
    telli: "Miruro · Telli",
  };
  return labels[value.toLowerCase()] ?? value;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function episodeNumber(value: Record<string, unknown>): number | null {
  for (const key of ["number", "episode", "episodeNumber", "ep"]) {
    const number = Number(value[key]);
    if (Number.isFinite(number)) return number;
  }
  return null;
}

function listForAudio(value: Record<string, unknown>, audio: AudioVariant): unknown[] {
  const episodes = asRecord(value.episodes);
  const list = episodes?.[audio] ?? value[audio] ?? value.episodes;
  return Array.isArray(list) ? list : [];
}

const PROVIDER_PRIORITY: Record<string, number> = {
  anibd: 1,
  reanime: 2,
  anikoto: 3,
  animegg: 4,
  anineko: 5,
  "2dhive": 6,
  mkissa: 7,
  senshi: 8,
  kickassanime: 9,
  kaa: 9,
  anidbapp: 10,
  megaplay: 11,
};

function providerEntries(payload: unknown): Array<[string, Record<string, unknown>]> {
  const root = asRecord(payload);
  if (!root) return [];
  const result = asRecord(root.results);
  const providers = asRecord(result?.providers) ?? asRecord(root.providers) ?? root;
  return Object.entries(providers)
    .flatMap(([name, value]): Array<[string, Record<string, unknown>]> => {
      const record = asRecord(value);
      return record && API_PROVIDERS.has(name.toLowerCase())
        ? [[name.toLowerCase(), record]]
        : [];
    })
    .sort(([a], [b]) => (PROVIDER_PRIORITY[a] ?? 99) - (PROVIDER_PRIORITY[b] ?? 99));
}

function episodeSlug(value: Record<string, unknown>, fallback: number): string | null {
  for (const key of ["slug", "epSlug", "sourceSlug", "rawPipeId", "id"]) {
    const candidate = value[key];
    if (typeof candidate === "string" || typeof candidate === "number") return String(candidate);
  }
  return String(fallback);
}

function miruroEpisodeParts(value: Record<string, unknown>, fallback: number): { category: AudioVariant; slug: string } {
  const raw = episodeSlug(value, fallback) ?? String(fallback);
  const parts = raw.split("/").filter(Boolean);
  const category = parts.find((part): part is AudioVariant => part === "sub" || part === "dub") ?? "sub";
  const slug = parts[parts.length - 1] || String(fallback);
  return { category, slug };
}

function tracks(value: unknown, origins: AllowedHttpsOrigins): MediaTrack[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const result = value.flatMap((item, index) => {
    const record = asRecord(item);
    const url = normalizeAllowedHttpsUrl(record?.url ?? record?.file, origins);
    if (!url) return [];
    return [{
      id: String(record?.id ?? record?.label ?? index),
      language: typeof record?.language === "string" ? record.language : "en",
      label: typeof record?.label === "string" ? record.label : "English",
      url,
      format: record?.format === "srt" ? "srt" : "vtt",
      isDefault: record?.isDefault === true,
    } satisfies MediaTrack];
  });
  return result.length ? result : undefined;
}

async function directJson(
  initialUrl: URL,
  origins: AllowedHttpsOrigins,
  signal?: AbortSignal,
): Promise<unknown> {
  let current = new URL(initialUrl);
  for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
    if (!isAllowedHttpsUrl(current, origins)) throw new Error("Anime API URL is not allowlisted");
    const response = await fetch(current, {
      signal,
      cache: "no-store",
      redirect: "manual",
      headers: { Accept: "application/json" },
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      const next = normalizeAllowedHttpsUrl(location, origins, current);
      if (!next || redirectCount === 3) throw new Error("Anime API redirect was rejected");
      current = new URL(next);
      continue;
    }
    if (response.ok) return response.json();
    throw new Error(`Anime provider returned HTTP ${response.status}`);
  }
  throw new Error("Anime API redirect limit exceeded");
}

async function json(
  url: URL,
  origins: AllowedHttpsOrigins,
  signal?: AbortSignal,
): Promise<unknown> {
  try {
    return await directJson(url, origins, signal);
  } catch (directErr) {
    try {
      if (!isAllowedHttpsUrl(url, origins)) throw directErr;
      const proxiedResponse = await proxiedFetch(url.toString(), {
        signal,
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (proxiedResponse.ok) return proxiedResponse.json();
    } catch {
      // Ignore proxy error and throw original error
    }
    throw directErr;
  }
}

async function watchCandidates(
  api: "anivexa" | "miruro",
  base: URL,
  provider: string,
  anilistId: number,
  audio: AudioVariant,
  episode: Record<string, unknown>,
  episodeNumberValue: number,
  origins: AllowedHttpsOrigins,
  signal?: AbortSignal,
): Promise<StreamCandidate[]> {
  const providerSegment = segment(provider);
  const idSegment = segment(anilistId);
  const audioSegment = segment(audio);
  const slug = episodeSlug(episode, episodeNumberValue);
  const miruroParts = api === "miruro" ? miruroEpisodeParts(episode, episodeNumberValue) : null;
  const resolvedSlug = miruroParts?.slug ?? slug;
  const slugSegment = segment(resolvedSlug);
  if (!providerSegment || !idSegment || !audioSegment || !slugSegment) return [];

  const url = new URL(base);
  if (api === "anivexa") {
    const watchPath = String(episode.id ?? `watch/${provider}/${anilistId}/${audio}/${provider}-${episodeNumberValue}`).replace(/^\//, "");
    url.pathname = `${url.pathname.replace(/\/$/, "")}/${watchPath}`;
  } else {
    url.pathname = `${url.pathname.replace(/\/$/, "")}/api/watch/${providerSegment}/${idSegment}/${miruroParts?.category ?? audioSegment}/${slugSegment}`;
  }

  const responsePayload = asRecord(await json(url, origins, signal));
  const payload = asRecord(responsePayload?.results) ?? responsePayload;
  if (!payload) return [];
  const rawStreams = [
    // Anivexa's reanime response exposes the direct HLS as a top-level
    // stream_url instead of a streams[] entry; surface it first.
    ...(api === "anivexa" && typeof payload.stream_url === "string" && payload.stream_url
      ? [{ url: payload.stream_url, type: payload.type ?? "hls" }]
      : []),
    ...(Array.isArray(payload.streams) ? payload.streams : []),
    ...(payload.bestStream ? [payload.bestStream] : []),
  ];
  const seen = new Set<string>();
  const candidates: StreamCandidate[] = [];
  for (let index = 0; index < rawStreams.length; index++) {
    const stream = asRecord(rawStreams[index]);
    const rawUrl = normalizeAllowedHttpsUrl(stream?.url ?? stream?.file, origins);
    if (!rawUrl || seen.has(rawUrl)) continue;
    if (rawUrl.includes("play2.php") || rawUrl.includes("/b2/play")) continue;
    // Anivexa wraps some streams in redirect URLs on its own host. Resolve
    // those to the final CDN URL here so the client never has to follow the
    // hop (browser and proxy would both send the wrong Referer on it).
    const streamUrl = await resolvePlaybackUrl(rawUrl, base, origins, signal);
    if (!streamUrl || seen.has(streamUrl)) continue;
    seen.add(streamUrl);
    const kind = streamKind(stream?.type, streamUrl);
    if (!kind) continue;
    const providerId = `${api}:${provider}`;
    const quality = typeof stream?.quality === "string" || typeof stream?.quality === "number" ? ` · ${stream.quality}` : "";
    const finalStreamUrl = (kind === "hls" || kind === "mp4" || kind === "dash")
      ? toProxiedUrl(streamUrl)
      : streamUrl;
    candidates.push({
      id: `${providerId}:${audio}:${episodeNumberValue}:${index}`,
      providerId,
      label: `${providerLabel(provider)} · ${audio === "sub" ? "Sub" : "Dub"}${quality}`,
      kind,
      url: finalStreamUrl,
      providerOrigin: new URL(streamUrl).origin,
      providerTier: "stable",
      playerVariant: api,
      mediaType: "anime",
      priority: 12 + index,
      audioVariant: audio,
      capabilities: kind === "iframe"
        ? { resumable: true, subtitles: "unverified", iframe: { allow: IFRAME_ALLOW, referrerPolicy: "origin-when-cross-origin" } }
        : { resumable: true, subtitles: "native" },
      quality: Number(stream?.quality) || undefined,
      subtitleTracks: tracks(stream?.subtitles ?? payload.subtitles, origins),
    } satisfies StreamCandidate);
  }
  return candidates;
}

/** Follows redirects that point back at the API host and returns the final URL. */
async function resolvePlaybackUrl(
  url: string,
  base: URL,
  origins: AllowedHttpsOrigins,
  signal?: AbortSignal,
): Promise<string> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (parsed.host !== base.host) return url;
  try {
    const response = await fetch(parsed, { redirect: "manual", signal, headers: { Accept: "*/*" } });
    const location = response.headers.get("location");
    if (location) {
      const resolved = normalizeAllowedHttpsUrl(location, origins, parsed);
      if (resolved) return resolved;
    }
  } catch {
    // Fall back to the wrapper URL on any failure.
  }
  return url;
}

function createRemoteAdapter(
  id: "anivexa" | "miruro",
  label: string,
  base: URL | null,
  endpoint: (base: URL, anilistId: number) => URL,
): SourceAdapter {
  const getBase = () =>
    base ??
    normalizeConfiguredHttpsBase(
      id === "anivexa"
        ? process.env.ANIVEXA_API_BASE_URL ?? process.env.NEXT_PUBLIC_ANIVEXA_API_BASE_URL
        : process.env.MIRURO_API_BASE_URL ?? process.env.NEXT_PUBLIC_MIRURO_API_BASE_URL,
    );

  return {
    id,
    label,
    supportedMediaTypes: ["anime"],
    identifierRequirements: { anime: ["anilistId", "episode"] },
    priority: 12,
    supports: (request) => {
      const activeBase = getBase();
      return Boolean(
        activeBase &&
          isAllowedHttpsUrl(activeBase, allowedOrigins()) &&
          request.mediaType === "anime" &&
          request.anilistId &&
          request.episode,
      );
    },
    async resolve(request, signal) {
      const activeBase = getBase();
      const origins = allowedOrigins();
      if (
        !activeBase ||
        !isAllowedHttpsUrl(activeBase, origins) ||
        !request.anilistId ||
        !request.episode
      ) return [];
      const primaryAudio: AudioVariant = request.preferredAudio === "dub" ? "dub" : "sub";
      const cacheKey = `${REMOTE_CACHE_VERSION}:${id}:${request.anilistId}:${request.episode}:${primaryAudio}`;
      const cached = animeRemoteCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now() && cached.data.length > 0) {
        return cached.data;
      }

      try {
        const catalogCandidatesPromise = (async (): Promise<StreamCandidate[]> => {
          const payload = await json(endpoint(activeBase, request.anilistId!), origins, signal);
          const entries = providerEntries(payload);
          const tasks: Promise<{ value: StreamCandidate[] } | null>[] = [];
          for (const [provider, providerData] of entries) {
            const episode = listForAudio(providerData, primaryAudio).find((item) => {
              const record = asRecord(item);
              return record ? episodeNumber(record) === request.episode : false;
            });
            const episodeRecord = asRecord(episode);
            if (!episodeRecord) continue;
            tasks.push(
              withDeadline(
                watchCandidates(
                  id,
                  activeBase,
                  provider,
                  request.anilistId!,
                  primaryAudio,
                  episodeRecord,
                  request.episode!,
                  origins,
                  signal,
                ).catch(() => []),
                DIRECT_WATCH_DEADLINE_MS,
              ),
            );
          }
          const outcomes = await Promise.all(tasks);
          return outcomes.flatMap((outcome) => outcome?.value ?? []);
        })().catch(() => []);

        const resolveDirectCandidates = async (): Promise<StreamCandidate[]> => {
          if (id !== "anivexa") return [];
          // Use the documented deterministic watch route only when the
          // catalogue cannot be read. When the catalogue is healthy it gives
          // us the provider-specific episode IDs and avoids doubling outbound
          // requests against the free API (which otherwise causes rate limits
          // and makes every provider disappear together).
          const directProviders = ANIVEXA_DIRECT_PROVIDERS;
          const directTasks: Promise<{ value: StreamCandidate[] } | null>[] = [];
          for (const provider of directProviders) {
            directTasks.push(
              withDeadline(
                watchCandidates(
                  id,
                  activeBase,
                  provider,
                  request.anilistId!,
                  primaryAudio,
                  {
                    id: `watch/${provider}/${request.anilistId}/${primaryAudio}/${provider}-${request.episode}`,
                    number: request.episode,
                  },
                  request.episode!,
                  origins,
                  signal,
                ).catch(() => []),
                DIRECT_WATCH_DEADLINE_MS,
              ),
            );
          }
          const outcomes = await Promise.all(directTasks);
          return outcomes.flatMap((outcome) => outcome?.value ?? []);
        };

        const catalogCandidates = await catalogCandidatesPromise;
        const directCandidates = catalogCandidates.length > 0 ? [] : await resolveDirectCandidates();
        const candidates: StreamCandidate[] = [];
        const seenProviders = new Set<string>();
        for (const candidate of [...catalogCandidates, ...directCandidates]) {
          if (seenProviders.has(candidate.providerId)) continue;
          seenProviders.add(candidate.providerId);
          candidates.push(candidate);
        }
        if (candidates.length > 0) {
          animeRemoteCache.set(cacheKey, { expiresAt: Date.now() + 300_000, data: candidates });
        }
        return candidates;
      } catch (err) {
        console.warn(`[${id}] Remote adapter failed to resolve:`, err);
        return [];
      }
    },
  };
}

export function createAnimeRemoteAdapters(): SourceAdapter[] {
  return [
    createRemoteAdapter(
      "anivexa",
      "Anivexa providers",
      normalizeConfiguredHttpsBase(process.env.ANIVEXA_API_BASE_URL ?? process.env.NEXT_PUBLIC_ANIVEXA_API_BASE_URL),
      (base, anilistId) => new URL(`episodes/${anilistId}`, base),
    ),
    createRemoteAdapter(
      "miruro",
      "MiruroAPI providers",
      normalizeConfiguredHttpsBase(process.env.MIRURO_API_BASE_URL ?? process.env.NEXT_PUBLIC_MIRURO_API_BASE_URL),
      (base, anilistId) => new URL(`api/episodes/${anilistId}`, base),
    ),
  ];
}
