export interface AllowedHttpsOrigins {
  exactOrigins: ReadonlySet<string>;
  wildcardHosts: ReadonlySet<string>;
}

const EMPTY_POLICY: AllowedHttpsOrigins = Object.freeze({
  exactOrigins: new Set<string>(),
  wildcardHosts: new Set<string>(),
});

function normalizedHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/^\[/, "").replace(/\]$/, "").replace(/\.$/, "");
}

function isPrivateOrReservedIpv4(hostname: string): boolean {
  const parts = hostname.split(".");
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part))) return false;
  const octets = parts.map(Number);
  if (octets.some((part) => part < 0 || part > 255)) return true;
  const [a, b, c] = octets;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 0 || b === 168)) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113)
  );
}

function isPrivateOrReservedHost(hostname: string): boolean {
  const host = normalizedHostname(hostname);
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) {
    return true;
  }
  if (isPrivateOrReservedIpv4(host)) return true;
  if (!host.includes(":")) return false;

  const compact = host.replace(/^0+(?=[0-9a-f])/i, "");
  return (
    compact === "::" ||
    compact === "::1" ||
    compact.startsWith("fc") ||
    compact.startsWith("fd") ||
    /^fe[89ab]/i.test(compact) ||
    compact.startsWith("::ffff:127.") ||
    compact.startsWith("::ffff:10.") ||
    compact.startsWith("::ffff:192.168.")
  );
}

function isSafeHttpsUrl(url: URL): boolean {
  return (
    url.protocol === "https:" &&
    !url.username &&
    !url.password &&
    !url.hash &&
    !url.port &&
    !isPrivateOrReservedHost(url.hostname)
  );
}

export function parseAllowedHttpsOrigins(raw: string | null | undefined): AllowedHttpsOrigins {
  if (!raw?.trim()) return EMPTY_POLICY;

  const exactOrigins = new Set<string>();
  const wildcardHosts = new Set<string>();

  for (const entry of raw.split(",").map((value) => value.trim()).filter(Boolean)) {
    if (entry === "*") continue;
    const wildcardMatch = /^https:\/\/\*\.([^/?#]+)\/?$/i.exec(entry);
    if (wildcardMatch) {
      const candidate = new URL(`https://${wildcardMatch[1]}`);
      if (isSafeHttpsUrl(candidate)) wildcardHosts.add(normalizedHostname(candidate.hostname));
      continue;
    }

    try {
      const candidate = new URL(entry);
      if (
        isSafeHttpsUrl(candidate) &&
        candidate.pathname === "/" &&
        !candidate.search
      ) {
        exactOrigins.add(candidate.origin);
      }
    } catch {
      // Invalid entries are ignored so one typo cannot broaden the policy.
    }
  }

  return { exactOrigins, wildcardHosts };
}

export function isAllowedHttpsUrl(url: URL, policy: AllowedHttpsOrigins): boolean {
  if (!isSafeHttpsUrl(url)) return false;
  if (policy.exactOrigins.has(url.origin)) return true;

  const hostname = normalizedHostname(url.hostname);
  return [...policy.wildcardHosts].some(
    (parent) => hostname !== parent && hostname.endsWith(`.${parent}`),
  );
}

export function normalizeAllowedHttpsUrl(
  value: unknown,
  policy: AllowedHttpsOrigins,
  base?: URL,
): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = base ? new URL(value, base) : new URL(value);
    return isAllowedHttpsUrl(url, policy) ? url.toString() : null;
  } catch {
    return null;
  }
}

export function normalizeConfiguredHttpsBase(value: string | undefined): URL | null {
  if (!value) return null;
  try {
    const url = new URL(value.endsWith("/") ? value : `${value}/`);
    return isSafeHttpsUrl(url) ? url : null;
  } catch {
    return null;
  }
}
