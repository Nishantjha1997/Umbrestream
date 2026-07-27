import Link from "next/link";
import { notFound } from "next/navigation";
import { Player } from "@/components/player/Player";
import { fallbackChain, listAdapters, resolveAll } from "@/lib/sources/registry";
import { isDetailMediaType } from "@/lib/tmdb/details";
import "@/lib/sources/bootstrap";

export default async function WatchPage(props: {
  params: Promise<{ mediaType: string; id: string }>;
  searchParams: Promise<{ s?: string; e?: string }>;
}) {
  const { mediaType, id } = await props.params;
  const { s, e } = await props.searchParams;

  if (!isDetailMediaType(mediaType)) notFound();

  const tmdbId = Number(id);
  if (!Number.isInteger(tmdbId) || tmdbId <= 0) notFound();

  const groups = await resolveAll({
    mediaType,
    tmdbId,
    season: s ? Number(s) : undefined,
    episode: e ? Number(e) : undefined,
  });

  const candidates = fallbackChain(groups);
  const errors = groups.filter((g) => g.error);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <Link
        href={`/title/${mediaType}/${tmdbId}`}
        className="mb-4 inline-block text-sm text-[var(--color-fg-muted)] transition hover:text-[var(--color-fg)]"
      >
        ← Back to details
      </Link>

      {candidates.length > 0 ? (
        <Player candidates={candidates} />
      ) : (
        <NoSources adapterCount={listAdapters().length} />
      )}

      {errors.length > 0 && (
        <ul className="mt-4 space-y-1 text-xs text-[var(--color-danger)]">
          {errors.map((g) => (
            <li key={g.adapterId}>
              {g.adapterLabel}: {g.error}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NoSources({ adapterCount }: { adapterCount: number }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-1)] p-8">
      <h1 className="text-lg font-semibold">No playable sources</h1>

      {adapterCount === 0 ? (
        <>
          <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
            No source adapters are registered, so nothing can resolve a stream for this title.
          </p>
          <p className="mt-4 text-sm text-[var(--color-fg-muted)]">
            Register one in{" "}
            <code className="rounded bg-[var(--color-surface-2)] px-1.5 py-0.5 text-xs">
              src/lib/sources/bootstrap.ts
            </code>
            . The contract and a worked example are in{" "}
            <code className="rounded bg-[var(--color-surface-2)] px-1.5 py-0.5 text-xs">
              src/lib/sources/README.md
            </code>
            .
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
          {adapterCount} adapter{adapterCount > 1 ? "s are" : " is"} registered, but none returned a
          stream for this title.
        </p>
      )}
    </div>
  );
}
