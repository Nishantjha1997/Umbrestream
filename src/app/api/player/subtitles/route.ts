export const runtime = "nodejs";

const MAX_SUBTITLE_BYTES = 2_000_000;

const allowedHosts = (): Set<string> =>
  new Set(
    (process.env.PLAYER_SUBTITLE_HOSTS ?? "")
      .split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean),
  );

function validSubtitleUrl(raw: string | null): URL | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    if (!allowedHosts().has(url.hostname.toLowerCase())) return null;
    if (!/\.(?:srt|vtt)$/i.test(url.pathname)) return null;
    return url;
  } catch {
    return null;
  }
}

function srtToVtt(input: string): string {
  const normalized = input.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  if (/^WEBVTT(?:\s|$)/.test(normalized)) return normalized;
  return `WEBVTT\n\n${normalized.replace(
    /(\d{2}:\d{2}:\d{2}),(\d{3})\s+-->\s+(\d{2}:\d{2}:\d{2}),(\d{3})/g,
    "$1.$2 --> $3.$4",
  )}`;
}

export async function GET(request: Request): Promise<Response> {
  const subtitleUrl = validSubtitleUrl(new URL(request.url).searchParams.get("url"));
  if (!subtitleUrl) {
    return Response.json({ message: "Subtitle URL is not allowed." }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const upstream = await fetch(subtitleUrl, {
      redirect: "manual",
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "text/vtt,application/x-subrip,text/plain" },
    });
    if (!upstream.ok || upstream.status >= 300) {
      return Response.json({ message: "Subtitle provider failed." }, { status: 502 });
    }

    const declaredLength = Number(upstream.headers.get("content-length") ?? 0);
    if (declaredLength > MAX_SUBTITLE_BYTES) {
      return Response.json({ message: "Subtitle file is too large." }, { status: 413 });
    }

    const bytes = new Uint8Array(await upstream.arrayBuffer());
    if (bytes.byteLength > MAX_SUBTITLE_BYTES) {
      return Response.json({ message: "Subtitle file is too large." }, { status: 413 });
    }

    return new Response(srtToVtt(new TextDecoder().decode(bytes)), {
      headers: {
        "Content-Type": "text/vtt; charset=utf-8",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error && error.name === "AbortError" ? "Timed out." : "Failed." },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
