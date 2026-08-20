import PosterCardSkeleton from "@/components/ui/other/PosterCardSkeleton";

export default function GridPageSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col items-center justify-center gap-8 py-6">
      <div className="flex w-full max-w-6xl items-center justify-between gap-3 px-2">
        <div className="bg-content3 dark:bg-content2 h-10 w-48 animate-pulse rounded-full motion-reduce:animate-none" />
        <div className="bg-content3 dark:bg-content2 h-10 w-32 animate-pulse rounded-full motion-reduce:animate-none" />
      </div>
      <div className="movie-grid">
        {Array.from({ length: 12 }).map((_, i) => (
          <PosterCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
