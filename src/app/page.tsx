import { ContentRow } from "@/components/media/ContentRow";
import { isTmdbConfigured, tmdb } from "@/lib/tmdb/client";
import { normalizeList, type TmdbPage } from "@/lib/tmdb/normalize";
import type { Title } from "@/types/title";

interface Row {
  heading: string;
  titles: Title[];
}

async function loadRows(): Promise<Row[]> {
  const specs = [
    { heading: "Trending This Week", endpoint: "trending/all/week", params: {}, fallback: "movie" },
    { heading: "Popular Movies", endpoint: "movie/popular", params: {}, fallback: "movie" },
    { heading: "Popular Shows", endpoint: "tv/popular", params: {}, fallback: "tv" },
    { heading: "Top Rated", endpoint: "movie/top_rated", params: {}, fallback: "movie" },
    {
      heading: "Animation",
      endpoint: "discover/movie",
      params: { with_genres: "16", sort_by: "popularity.desc" },
      fallback: "movie",
    },
  ] as const;

  const settled = await Promise.allSettled(
    specs.map((s) => tmdb<TmdbPage>(s.endpoint, s.params)),
  );

  return settled.flatMap((result, i) => {
    if (result.status !== "fulfilled") return [];
    const titles = normalizeList(result.value, specs[i].fallback);
    return titles.length ? [{ heading: specs[i].heading, titles }] : [];
  });
}

export default async function HomePage() {
  if (!isTmdbConfigured()) return <SetupNotice />;

  const rows = await loadRows();

  if (rows.length === 0) {
    return (
      <Shell>
        <p className="text-[var(--color-fg-muted)]">
          Connected, but TMDB returned nothing. Check that your token is a valid{" "}
          <strong className="text-[var(--color-fg)]">API Read Access Token</strong>.
        </p>
      </Shell>
    );
  }

  return (
    <div className="space-y-10 py-8">
      {rows.map((row, i) => (
        <ContentRow key={row.heading} heading={row.heading} titles={row.titles} priority={i === 0} />
      ))}

      <footer className="px-4 pt-8 text-xs leading-relaxed text-[var(--color-fg-subtle)] md:px-8">
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </footer>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24">
      <h1 className="mb-4 text-2xl font-bold tracking-tight">Umbra</h1>
      {children}
    </div>
  );
}

function SetupNotice() {
  return (
    <Shell>
      <p className="mb-6 text-[var(--color-fg-muted)]">
        No TMDB token found. Add one to see anything here.
      </p>
      <ol className="space-y-3 text-sm text-[var(--color-fg-muted)]">
        <li>
          <span className="mr-2 text-[var(--color-accent)]">1.</span>
          Create a free key at{" "}
          <a
            href="https://www.themoviedb.org/settings/api"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--color-accent-hover)] underline underline-offset-2"
          >
            themoviedb.org/settings/api
          </a>
          .
        </li>
        <li>
          <span className="mr-2 text-[var(--color-accent)]">2.</span>
          Copy <code className="rounded bg-[var(--color-surface-2)] px-1.5 py-0.5">.env.example</code>{" "}
          to <code className="rounded bg-[var(--color-surface-2)] px-1.5 py-0.5">.env.local</code>.
        </li>
        <li>
          <span className="mr-2 text-[var(--color-accent)]">3.</span>
          Paste the <strong className="text-[var(--color-fg)]">API Read Access Token</strong> (the
          long JWT, not the short v3 key) as{" "}
          <code className="rounded bg-[var(--color-surface-2)] px-1.5 py-0.5">TMDB_READ_TOKEN</code>,
          then restart the dev server.
        </li>
      </ol>
    </Shell>
  );
}
