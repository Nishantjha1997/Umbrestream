/**
 * Cloudflare Edge Worker Proxy Helper
 * Bypasses CORS and Cloudflare Datacenter Blocks on both client and server.
 */

const DEFAULT_PROXY_BASE = "https://streamfree-proxy.nishantjha31.workers.dev";

export function getProxyBase(): string {
  if (typeof process !== "undefined" && process.env) {
    return (
      process.env.NEXT_PUBLIC_CLOUDFLARE_PROXY_URL ||
      process.env.CLOUDFLARE_PROXY_URL ||
      DEFAULT_PROXY_BASE
    );
  }
  return DEFAULT_PROXY_BASE;
}

export function toProxiedUrl(targetUrl: string): string {
  if (!targetUrl || !targetUrl.startsWith("http")) return targetUrl;
  const base = getProxyBase().replace(/\/$/, "");
  return `${base}/?url=${encodeURIComponent(targetUrl)}`;
}

export async function proxiedFetch(
  targetUrl: string,
  init?: RequestInit,
): Promise<Response> {
  const finalUrl = toProxiedUrl(targetUrl);
  return fetch(finalUrl, init);
}
