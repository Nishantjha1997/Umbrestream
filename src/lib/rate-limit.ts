/**
 * Fixed-window per-caller rate limiting for route handlers.
 *
 * ## Scope, and what this is not
 *
 * State lives in a module-level `Map`, so a limit is enforced **per serverless
 * instance**. On a platform that fans out across many lambdas the effective
 * global limit is `limit x instances`, and every cold start forgets everything.
 * That is a real ceiling, not a detail: this is a brake on casual abuse and
 * runaway clients, not a defence against a distributed attacker. Back it with
 * Redis (Upstash `@upstash/ratelimit` or equivalent) before treating any number
 * here as a guarantee.
 *
 * It is still worth having, because the endpoints it guards each turn one cheap
 * inbound request into several expensive outbound ones.
 */

interface Window {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Map<string, Window>>();

const bucketFor = (name: string): Map<string, Window> => {
  let bucket = buckets.get(name);
  if (!bucket) {
    bucket = new Map();
    buckets.set(name, bucket);
  }
  return bucket;
};

/**
 * Best-effort caller identity.
 *
 * `x-forwarded-for` is a client-supplied header. Reading its **first** entry —
 * the common idiom — hands an attacker unlimited quota, because they choose that
 * value: `X-Forwarded-For: 1.2.3.4` rotated per request looks like a new caller
 * every time. Only the entries appended by infrastructure you control are
 * trustworthy, and those are at the *end* of the list.
 *
 * So: prefer a platform header the edge overwrites (`x-vercel-forwarded-for`,
 * `cf-connecting-ip`, `x-real-ip`), and otherwise take the **last** hop of
 * `x-forwarded-for` rather than the first.
 *
 * Requests with no usable header share one bucket. That is deliberate — a
 * misconfigured deployment should throttle, not silently exempt everyone.
 */
export function callerKey(source: Request | Headers): string {
  const headers = source instanceof Headers ? source : source.headers;

  const platform =
    headers.get("x-vercel-forwarded-for") ??
    headers.get("cf-connecting-ip") ??
    headers.get("x-real-ip");
  if (platform?.trim()) return platform.trim();

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded
      .split(",")
      .map((hop) => hop.trim())
      .filter(Boolean);
    const nearest = hops.at(-1);
    if (nearest) return nearest;
  }

  return "unknown";
}

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the current window resets. Suitable for `Retry-After`. */
  retryAfter: number;
  remaining: number;
}

export function rateLimit(
  name: string,
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const bucket = bucketFor(name);
  const now = Date.now();

  // Opportunistic sweep so a long-lived instance does not accumulate one entry
  // per distinct caller forever.
  if (bucket.size > 500) {
    for (const [k, window] of bucket) {
      if (now > window.resetAt) bucket.delete(k);
    }
  }

  const window = bucket.get(key);
  if (!window || now > window.resetAt) {
    bucket.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0, remaining: limit - 1 };
  }

  if (window.count >= limit) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((window.resetAt - now) / 1000)),
      remaining: 0,
    };
  }

  window.count += 1;
  return { allowed: true, retryAfter: 0, remaining: limit - window.count };
}

/** 429 with the headers a well-behaved client needs to back off. */
export function tooManyRequests(retryAfter: number): Response {
  return Response.json(
    { message: "Rate limit exceeded. Slow down." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

/**
 * Read at most `maxBytes` of a response body as text, then abandon the rest.
 *
 * `await response.text()` on an upstream you do not control is an unbounded
 * allocation driven by a third party: a provider returning a multi-hundred-MB
 * body (or a slow trickle) takes the Node process down. Every route that reads a
 * remote body only to pattern-match it should use this instead.
 */
export async function boundedText(response: Response, maxBytes = 80_000): Promise<string> {
  if (!response.body) return "";

  const declared = Number(response.headers.get("content-length") ?? 0);
  if (Number.isFinite(declared) && declared > maxBytes * 20) {
    // Wildly oversized and self-declared: do not even start reading.
    await response.body.cancel().catch(() => undefined);
    return "";
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let read = 0;
  let text = "";

  try {
    while (read < maxBytes) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      const take = Math.min(value.byteLength, maxBytes - read);
      text += decoder.decode(value.subarray(0, take), { stream: true });
      read += take;
    }
    text += decoder.decode();
  } finally {
    await reader.cancel().catch(() => undefined);
  }

  return text;
}
