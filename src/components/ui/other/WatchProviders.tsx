"use client";

import SectionTitle from "@/components/ui/other/SectionTitle";
import { isEmpty } from "@/utils/helpers";
import { getImageUrl } from "@/utils/movies";

/** A single JustWatch-sourced offer entry as TMDB returns it. */
interface Provider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

/**
 * One country's offers.
 *
 * `tmdb-ts` types `watch/providers.results` as an interface with a key for
 * *every* ISO-3166-1 country, each declaring a slightly different set of
 * buckets. The real payload only carries the handful of countries that
 * actually have offers, so the declared type both over-promises (missing
 * countries are typed as present) and under-describes (`free` and `ads` exist
 * in the API but not in the type). This is the honest shape; the single cast
 * below is where the two meet.
 */
interface ProviderRegion {
  link?: string;
  flatrate?: Provider[];
  free?: Provider[];
  ads?: Provider[];
  rent?: Provider[];
  buy?: Provider[];
}

export interface WatchProvidersSectionProps {
  /**
   * The `watch/providers` append from a TMDB movie or TV detail response.
   * Deliberately loose: the caller passes the append through untouched.
   */
  providers?: { results?: unknown };
  /**
   * ISO-3166-1 alpha-2 region to display. Defaults to the browser's region,
   * falling back to US, then to whichever region has offers.
   */
  region?: string;
}

/** Ordered so the cheapest way to watch is listed first. */
const BUCKETS = [
  { key: "flatrate", label: "Stream" },
  { key: "free", label: "Free" },
  { key: "ads", label: "With ads" },
  { key: "rent", label: "Rent" },
  { key: "buy", label: "Buy" },
] as const;

/** `en-GB` → `GB`. Returns undefined outside the browser or for bare `en`. */
const browserRegion = (): string | undefined => {
  if (typeof navigator === "undefined") return undefined;
  const parts = (navigator.language || "").split("-");
  const candidate = parts[parts.length - 1];
  return candidate?.length === 2 ? candidate.toUpperCase() : undefined;
};

const hasOffers = (entry?: ProviderRegion): boolean =>
  BUCKETS.some(({ key }) => !isEmpty(entry?.[key]));

/** Localised country name, e.g. `GB` → "United Kingdom". Falls back to the code. */
const regionName = (code: string): string => {
  try {
    return new Intl.DisplayNames(undefined, { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
};

/**
 * "Where to Watch" — the `watch/providers` payload every detail page has always
 * fetched and never rendered (§8).
 *
 * Kept typographic rather than card-heavy: it is reference information sitting
 * under the synopsis, not a second call to action competing with Play (§1.1.5).
 * Logos are the only colour, and they belong to the providers.
 *
 * Renders nothing at all when the title has no offers anywhere — an empty
 * "Where to Watch" heading is worse than no heading.
 */
const WatchProvidersSection: React.FC<WatchProvidersSectionProps> = ({ providers, region }) => {
  // The one place the declared TMDB type and the real payload are reconciled.
  const byRegion = providers?.results as Record<string, ProviderRegion | undefined> | undefined;
  if (!byRegion) return null;

  const preferred = [region, browserRegion(), "US"].filter((code): code is string =>
    Boolean(code),
  );
  const resolved =
    preferred.find((code) => hasOffers(byRegion[code])) ??
    Object.keys(byRegion).find((code) => hasOffers(byRegion[code]));

  if (!resolved) return null;

  const entry = byRegion[resolved];
  const groups = BUCKETS.map(({ key, label }) => ({ label, items: entry?.[key] ?? [] })).filter(
    (group) => !isEmpty(group.items),
  );

  if (isEmpty(groups)) return null;

  return (
    <section id="watch-providers" className="flex flex-col gap-4">
      <SectionTitle size="h6">Where to Watch</SectionTitle>

      <dl className="flex flex-col gap-3">
        {groups.map(({ label, items }) => (
          <div
            key={label}
            className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5"
          >
            <dt className="text-[11px] font-semibold tracking-[0.16em] text-default-500 uppercase sm:w-24 sm:shrink-0">
              {label}
            </dt>
            <dd className="flex flex-wrap gap-2">
              {items.map((provider) => (
                <ProviderLogo key={provider.provider_id} provider={provider} link={entry?.link} />
              ))}
            </dd>
          </div>
        ))}
      </dl>

      {/* TMDB's terms require the JustWatch attribution wherever this data is shown. */}
      <p className="text-[11px] text-default-400">
        Availability in {regionName(resolved)} · Source: JustWatch
      </p>
    </section>
  );
};

/**
 * A provider's mark. When TMDB gives a JustWatch deep link the mark becomes a
 * real anchor — with a focus ring at least as loud as its hover state — and
 * otherwise stays a plain image rather than a button that does nothing.
 */
const ProviderLogo: React.FC<{ provider: Provider; link?: string }> = ({ provider, link }) => {
  const logo = (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={getImageUrl(provider.logo_path)}
      alt={provider.provider_name}
      title={provider.provider_name}
      loading="lazy"
      decoding="async"
      draggable={false}
      className="size-10 rounded-(--radius-card) object-cover"
    />
  );

  if (!link) {
    return <span className="block shadow-(--elevation-card)">{logo}</span>;
  }

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Watch on ${provider.provider_name}`}
      className="block rounded-(--radius-card) shadow-(--elevation-card) ring-1 ring-white/0 transition duration-(--duration-fast) ease-(--ease-out-quint) hover:scale-[1.06] hover:ring-white/25 focus-visible:scale-[1.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:focus-visible:scale-100"
    >
      {logo}
    </a>
  );
};

export default WatchProvidersSection;
