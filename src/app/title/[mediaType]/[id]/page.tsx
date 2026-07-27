import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentRow } from "@/components/media/ContentRow";
import { isTmdbConfigured } from "@/lib/tmdb/client";
import { fetchTitleDetail, isDetailMediaType, type CastMember } from "@/lib/tmdb/details";

function runtimeLabel(min?: number): string | undefined {
  if (!min || min <= 0) return undefined;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export async function generateMetadata(props: {
  params: Promise<{ mediaType: string; id: string }>;
}) {
  const { mediaType, id } = await props.params;
  if (!isTmdbConfigured() || !isDetailMediaType(mediaType)) return { title: "Umbra" };

  const detail = await fetchTitleDetail(mediaType, Number(id));
  return detail
    ? { title: `${detail.title} — Umbra`, description: detail.overview.slice(0, 160) }
    : { title: "Not found — Umbra" };
}

export default async function TitlePage(props: {
  params: Promise<{ mediaType: string; id: string }>;
}) {
  // Next 16: params is a Promise. Synchronous access was removed, not deprecated.
  const { mediaType, id } = await props.params;

  if (!isDetailMediaType(mediaType)) notFound();

  const tmdbId = Number(id);
  if (!Number.isInteger(tmdbId) || tmdbId <= 0) notFound();

  if (!isTmdbConfigured()) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24">
        <p className="text-[var(--color-fg-muted)]">
          No TMDB token configured.{" "}
          <Link href="/" className="text-[var(--color-accent-hover)] underline underline-offset-2">
            Back home
          </Link>
        </p>
      </div>
    );
  }

  const detail = await fetchTitleDetail(mediaType, tmdbId);
  if (!detail) notFound();

  const meta = [
    detail.year?.toString(),
    runtimeLabel(detail.runtimeMin),
    detail.seasonCount ? `${detail.seasonCount} season${detail.seasonCount > 1 ? "s" : ""}` : undefined,
  ].filter(Boolean) as string[];

  return (
    <div className="pb-16">
      <header className="relative">
        {detail.backdropUrl && (
          <div className="absolute inset-0 h-[26rem] overflow-hidden">
            <Image
              src={detail.backdropUrl}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-top opacity-40"
            />
            {/* Two gradients: vertical fades into the page, horizontal keeps
                text legible over bright artwork on wide screens. */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 to-transparent" />
          </div>
        )}

        <div className="relative flex flex-col gap-6 px-4 pt-10 md:flex-row md:gap-8 md:px-8 md:pt-16">
          <div className="poster-frame relative aspect-[2/3] w-40 shrink-0 overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-surface-1)] md:w-56">
            {detail.posterUrl && (
              <Image
                src={detail.posterUrl}
                alt=""
                fill
                priority
                sizes="(max-width: 768px) 160px, 224px"
                className="object-cover"
              />
            )}
          </div>

          <div className="min-w-0 flex-1 md:pt-4">
            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">{detail.title}</h1>

            {detail.originalTitle && detail.originalTitle !== detail.title && (
              <p className="mt-1 text-sm text-[var(--color-fg-subtle)]">{detail.originalTitle}</p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--color-fg-muted)]">
              {detail.rating !== undefined && detail.rating > 0 && (
                <span className="rounded-md bg-[var(--color-accent-dim)] px-2 py-0.5 font-semibold tabular-nums text-[var(--color-accent-hover)]">
                  {detail.rating.toFixed(1)}
                </span>
              )}
              {meta.map((m) => (
                <span key={m} className="tabular-nums">
                  {m}
                </span>
              ))}
            </div>

            {detail.genres.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {detail.genres.map((g) => (
                  <li
                    key={g.id}
                    className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-fg-muted)]"
                  >
                    {g.name}
                  </li>
                ))}
              </ul>
            )}

            {detail.overview && (
              <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[var(--color-fg-muted)]">
                {detail.overview}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/watch/${detail.mediaType}/${detail.tmdbId}`}
                className="rounded-lg bg-[var(--color-accent)] px-6 py-2.5 text-sm font-semibold text-[var(--color-accent-fg)] transition hover:bg-[var(--color-accent-hover)]"
              >
                Play
              </Link>
              {detail.trailerKey && (
                <a
                  href={`https://www.youtube.com/watch?v=${detail.trailerKey}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-[var(--color-border-strong)] px-6 py-2.5 text-sm font-semibold text-[var(--color-fg)] transition hover:bg-[var(--color-surface-2)]"
                >
                  Trailer
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {detail.seasons.length > 0 && (
        <section className="mt-12 px-4 md:px-8">
          <h2 className="mb-3 text-lg font-semibold tracking-tight">Seasons</h2>
          <ul className="flex flex-wrap gap-2">
            {detail.seasons.map((s) => (
              <li key={s.seasonNumber}>
                <span className="inline-block rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-1)] px-4 py-2 text-sm text-[var(--color-fg-muted)]">
                  {s.name}
                  <span className="ml-2 text-xs text-[var(--color-fg-subtle)] tabular-nums">
                    {s.episodeCount} ep
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {detail.cast.length > 0 && <CastRow cast={detail.cast} />}

      {detail.similar.length > 0 && (
        <div className="mt-12">
          <ContentRow heading="More like this" titles={detail.similar} />
        </div>
      )}

      <footer className="mt-16 px-4 text-xs text-[var(--color-fg-subtle)] md:px-8">
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </footer>
    </div>
  );
}

function CastRow({ cast }: { cast: CastMember[] }) {
  return (
    <section className="mt-12">
      <h2 className="mb-3 px-4 text-lg font-semibold tracking-tight md:px-8">Cast</h2>
      <div className="tray flex gap-4 overflow-x-auto px-4 pb-2 md:px-8">
        {cast.map((person) => (
          <div key={person.id} className="w-24 shrink-0 text-center">
            <div className="poster-frame relative mx-auto aspect-square w-20 overflow-hidden rounded-full bg-[var(--color-surface-1)]">
              {person.profileUrl ? (
                <Image
                  src={person.profileUrl}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <span className="flex h-full items-center justify-center text-lg text-[var(--color-fg-subtle)]">
                  {person.name.charAt(0)}
                </span>
              )}
            </div>
            <p className="mt-2 line-clamp-2 text-xs font-medium leading-tight">{person.name}</p>
            {person.character && (
              <p className="mt-0.5 line-clamp-2 text-[11px] leading-tight text-[var(--color-fg-subtle)]">
                {person.character}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
