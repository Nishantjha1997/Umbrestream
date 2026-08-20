export default function AnimePlayerLoading() {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-black">
      <div className="aspect-video w-full max-w-[min(100vw,1600px)] animate-pulse bg-neutral-950" />
    </div>
  );
}
