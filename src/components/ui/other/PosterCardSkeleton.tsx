/**
 * Placeholder for a single <PosterCard>.
 *
 * Deliberately mirrors PosterCard's own layout — 2:3 poster, then a title line
 * and a shorter metadata line below it — so a row or grid does not reflow when
 * real data replaces it. It used to render a HeroUI Card with header/body/
 * footer chrome, matching a `variant="bordered"` card that no longer exists.
 */
const PosterCardSkeleton: React.FC = () => (
  <div aria-hidden="true" className="flex w-full flex-col gap-2">
    <div className="bg-content3 dark:bg-content2 aspect-2/3 w-full animate-pulse rounded-(--radius-card) motion-reduce:animate-none" />
    <div className="flex flex-col gap-1.5">
      <div className="bg-content3 dark:bg-content2 h-3.5 w-4/5 animate-pulse rounded-full motion-reduce:animate-none" />
      <div className="bg-content3 dark:bg-content2 h-3 w-1/2 animate-pulse rounded-full motion-reduce:animate-none" />
    </div>
  </div>
);

export default PosterCardSkeleton;
