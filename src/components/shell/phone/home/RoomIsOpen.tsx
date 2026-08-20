"use client";

/**
 * `PHONE_SPEC.md` §G "06 — Room is open"
 * Demoted to a compact chip below the primary shelves.
 */
export default function RoomIsOpen() {
  return (
    <section className="flex flex-col gap-2 px-5" aria-label="Watch parties">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.025] px-4 py-3">
        <div className="flex min-w-0 flex-col">
          <p className="truncate text-xs font-semibold text-white">Watch parties</p>
          <p className="truncate text-[11px] text-white/60">
            Sync playback with friends in real time — coming soon.
          </p>
        </div>
        <span
          aria-disabled="true"
          className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/70"
        >
          Coming soon
        </span>
      </div>
    </section>
  );
}
