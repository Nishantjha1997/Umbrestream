import PosterCardSkeleton from "@/components/ui/other/PosterCardSkeleton";
import { Skeleton } from "@heroui/react";

export default function GridPageSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center gap-8 py-6">
      <div className="flex w-full max-w-6xl items-center justify-between gap-3 px-2">
        <Skeleton className="h-10 w-48 rounded-full" />
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>
      <div className="movie-grid">
        {Array.from({ length: 12 }).map((_, i) => (
          <PosterCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
