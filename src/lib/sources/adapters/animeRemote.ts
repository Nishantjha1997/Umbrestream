import type { AudioVariant, MediaTrack, SourceAdapter, StreamCandidate, StreamKind } from "../types";

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
]);

const IFRAME_ALLOW = "autoplay; encrypted-media; picture-in-picture; fullscreen; screen-wake-lock";

function configuredOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
}

function configuredBase(value: string | undefined): URL | null {
  if (!value) return null;
  try {
    const url = new URL(value.endsWith("/") ? value : `${value}/`);
    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function allowedOrigins(): Set<string> {
  return new Set(
    (process.env.STREAMFREE_ANIME_ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((value) => configuredOrigin(value.trim()))
      .filter((value): value is string => Boolean(value)),
  );
}

function safeUrl(value: unknown, origins: Set<string>): string | null {
  if (typeof value !== "string" || value.length === 0) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && origins.has(url.origin) ? url.toString() : null;
  } catch {
    return null;
  }
}

function segment(value: unknown): string | null {
  return typeof value === "string" || typeof value === "number" ? encodeURIComponent(String(value)) : null;
}

function streamKind(value: unknown, url: string): StreamKind | null {
  const declared = typeof value === "string" ? value.toLowerCase() : "";
  if (declared === "hls" || declared === "m3u8") return "hls";
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
    miruro: "Miruro",
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

function providerEntries(payload: unknown): Array<[string, Record<string, unknown>]> {
  const root = asRecord(payload);
  if (!root) return [];
  const providers = asRecord(root.providers) ?? root;
  return Object.entries(providers).flatMap(([name, value]) => {
    const record = asRecord(value);
    return record && API_PROVIDERS.has(name.toLowerCase()) ? [[name.toLowerCase(), record] as const] : [];
  });
}

function episodeSlug(value: Record<string, unknown>, fallback: number): string | null {
  for (const key of ["slug", "epSlug", "sourceSlug", "rawPipeId", "id"]) {
    const candidate = value[key];
    if (typeof candidate === "string" || typeof candidate === "number") return String(candidate);
  }
  return String(fallback);
}

function tracks(value: unknown, origins: Set<string>): MediaTrack[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const result = value.flatMap((item, index) => {
    const record = asRecord(item);
    const url = safeUrl(record?.url ?? record?.file, origins);
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

async function json(url: URL, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(url, {
    signal,
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Anime provider returned HTTP ${response.status}`);
  return response.json();
}

async function watchCandidates(
  api: "anivexa" | "miruro",
  base: URL,
  provider: string,
  anilistId: number,
  audio: AudioVariant,
  episode: Record<string, unknown>,
  episodeNumberValue: number,
  origins: Set<string>,
  signal?: AbortSignal,
): Promise<StreamCandidate[]> {
  const providerSegment = segment(provider);
  const idSegment = segment(anilistId);
  const audioSegment = segment(audio);
  const slug = episodeSlug(episode, episodeNumberValue);
  const slugSegment = segment(slug);
  if (!providerSegment || !idSegment || !audioSegment || !slugSegment) return [];

  const url = new URL(base);
  if (api === "anivexa") {
    const watchPath = String(episode.id ?? `watch/${provider}/${anilistId}/${audio}/${provider}-${episodeNumberValue}`).replace(/^\//, "");
    url.pathname = `${url.pathname.replace(/\/$/, "")}/${watchPath}`;
  } else {
    url.pathname = `${url.pathname.replace(/\/$/, "")}/api/watch/${providerSegment}/${idSegment}/${audioSegment}/${slugSegment}`;
  }

  const payload = asRecord(await json(url, signal));
  if (!payload) return [];
  const rawStreams = [
    ...(Array.isArray(payload.streams) ? payload.streams : []),
    ...(payload.bestStream ? [payload.bestStream] : []),
  ];
  const seen = new Set<string>();
  return rawStreams.flatMap((raw, index) => {
    const stream = asRecord(raw);
    const streamUrl = safeUrl(stream?.url ?? stream?.file, origins);
    if (!streamUrl || seen.has(streamUrl)) return [];
    seen.add(streamUrl);
    const kind = streamKind(stream?.type, streamUrl);
    if (!kind) return [];
    const providerId = `${api}:${provider}`;
    const quality = typeof stream?.quality === "string" || typeof stream?.quality === "number" ? ` · ${stream.quality}` : "";
    return [{
      id: `${providerId}:${audio}:${episodeNumberValue}:${index}`,
      providerId,
      label: `${providerLabel(provider)} · ${audio === "sub" ? "Sub" : "Dub"}${quality}`,
      kind,
      url: streamUrl,
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
    } satisfies StreamCandidate];
  });
}

function createRemoteAdapter(
  id: "anivexa" | "miruro",
  label: string,
  base: URL | null,
  endpoint: (base: URL, anilistId: number) => URL,
): SourceAdapter {
  return {
    id,
    label,
    supportedMediaTypes: ["anime"],
    identifierRequirements: { anime: ["anilistId", "episode"] },
    priority: 12,
    supports: (request) => Boolean(base && request.mediaType === "anime" && request.anilistId && request.episode),
    async resolve(request, signal) {
      if (!base || !request.anilistId || !request.episode) return [];
      const origins = allowedOrigins();
      const apiOrigin = base.origin;
      if (!origins.has(apiOrigin)) return [];
      const audio: AudioVariant = request.preferredAudio === "dub" ? "dub" : "sub";
      const payload = await json(endpoint(base, request.anilistId), signal);
      const candidates: StreamCandidate[] = [];
      for (const [provider, providerData] of providerEntries(payload)) {
        const episode = listForAudio(providerData, audio).find((item) => {
          const record = asRecord(item);
          return record ? episodeNumber(record) === request.episode : false;
        });
        const episodeRecord = asRecord(episode);
        if (!episodeRecord) continue;
        candidates.push(...await watchCandidates(id, base, provider, request.anilistId, audio, episodeRecord, request.episode, origins, signal));
      }
      return candidates;
    },
  };
}

export function createAnimeRemoteAdapters(): SourceAdapter[] {
  return [
    createRemoteAdapter(
      "anivexa",
      "Anivexa providers",
      configuredBase(process.env.ANIVEXA_API_BASE_URL),
      (base, anilistId) => new URL(`episodes/${anilistId}`, base),
    ),
    createRemoteAdapter(
      "miruro",
      "MiruroAPI providers",
      configuredBase(process.env.MIRURO_API_BASE_URL),
      (base, anilistId) => new URL(`api/episodes/${anilistId}`, base),
    ),
  ];
}
