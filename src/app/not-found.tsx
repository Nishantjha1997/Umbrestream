import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-start px-6 py-32">
      <p className="text-sm font-semibold tracking-wider text-[var(--color-accent)]">404</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">Nothing here</h1>
      <p className="mt-3 text-[var(--color-fg-muted)]">
        That title doesn&apos;t exist, or TMDB doesn&apos;t have it.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--color-accent-fg)] transition hover:bg-[var(--color-accent-hover)]"
      >
        Back home
      </Link>
    </div>
  );
}
