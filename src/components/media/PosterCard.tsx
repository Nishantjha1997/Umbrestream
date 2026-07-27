import Image from "next/image";
import Link from "next/link";
import type { Title } from "@/types/title";

interface Props {
  title: Title;
  /** 0–100. Renders the continue-watching bar when > 0. */
  progress?: number;
  priority?: boolean;
}

export function PosterCard({ title, progress = 0, priority = false }: Props) {
  const href = `/title/${title.mediaType}/${title.tmdbId ?? title.anilistId}`;

  return (
    <Link
      href={href}
      className="group block w-[9.5rem] shrink-0 sm:w-[10.5rem] md:w-[11.5rem]"
    >
      <div className="poster-frame relative aspect-[2/3] overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-surface-1)] transition-transform duration-200 group-hover:-translate-y-1">
        {title.posterUrl ? (
          <Image
            src={title.posterUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 152px, 184px"
            priority={priority}
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-3 text-center text-xs text-[var(--color-fg-subtle)]">
            {title.title}
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 rounded-[var(--radius-card)] opacity-0 ring-2 ring-[var(--color-accent)] transition-opacity duration-200 group-hover:opacity-100" />

        {title.rating !== undefined && title.rating > 0 && (
          <span className="absolute right-1.5 top-1.5 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-[var(--color-fg)] backdrop-blur-sm">
            {title.rating.toFixed(1)}
          </span>
        )}

        {progress > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-black/60">
            <div
              className="h-full bg-[var(--color-accent)]"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        )}
      </div>

      <p className="mt-2 line-clamp-2 text-[13px] font-medium leading-snug text-[var(--color-fg)] group-hover:text-[var(--color-accent-hover)]">
        {title.title}
      </p>
      {title.year && (
        <p className="mt-0.5 text-[11px] tabular-nums text-[var(--color-fg-subtle)]">
          {title.year}
        </p>
      )}
    </Link>
  );
}
