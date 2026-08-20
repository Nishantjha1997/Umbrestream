/**
 * Section 06, "Room is open" (DESKTOP_SPEC.md §G).
 * Demoted to a compact chip below the primary shelves.
 */

export default function RoomIsOpenDesktop() {
  return (
    <section className="px-12 pb-2" aria-label="Watch parties">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.025] px-6 py-3.5">
        <div className="flex min-w-0 flex-col">
          <p className="text-sm font-semibold text-white">Watch parties</p>
          <p className="text-xs text-white/70">
            Sync playback with friends and react together, in real time — coming soon.
          </p>
        </div>
        <span
          aria-disabled="true"
          className="flex h-8 flex-none items-center rounded-full border border-white/10 bg-white/5 px-4 text-xs font-medium text-white/70"
        >
          Coming soon
        </span>
      </div>
    </section>
  );
}
