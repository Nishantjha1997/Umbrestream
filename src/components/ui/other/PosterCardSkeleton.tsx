import { Skeleton } from "@heroui/react";

/**
 * Placeholder for a single <PosterCard>.
 *
 * Deliberately mirrors PosterCard's own layout — 2:3 poster, then a title line
 * and a shorter metadata line below it — so a row or grid does not reflow when
 * real data replaces it. It used to render a HeroUI Card with header/body/
 * footer chrome, matching a `variant="bordered"` card that no longer exists.
 */
const PosterCardSkeleton: React.FC = () => (
  <div className="flex w-full flex-col gap-2">
    <Skeleton className="aspect-2/3 w-full rounded-(--radius-card)" />
    <div className="flex flex-col gap-1.5">
      <Skeleton className="h-3.5 w-4/5 rounded-full" />
      <Skeleton className="h-3 w-1/2 rounded-full" />
    </div>
  </div>
);

export default PosterCardSkeleton;
