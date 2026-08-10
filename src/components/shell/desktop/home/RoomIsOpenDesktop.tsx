/**
 * Section 06, "Room is open" (DESKTOP_SPEC.md §G). Watch parties are not a
 * real feature in this app — nothing party/presence-shaped exists under
 * `src/actions/` or `src/hooks/`. The mock's fake three-avatar presence stack
 * and its fake specific countdown ("in twelve minutes") are invented data
 * with no backing system, so neither is built here. This is an honest
 * "coming soon" teaser instead: no fabricated names, no fabricated presence,
 * no link to a feature that doesn't exist yet.
 *
 * Copy matches `phone/home/RoomIsOpen.tsx` verbatim so the same honest claim
 * reads identically on both platforms rather than drifting into two slightly
 * different promises.
 */

import SectionHeader from "./SectionHeader";

export default function RoomIsOpenDesktop() {
  return (
    <section className="flex flex-col gap-4 px-12 pb-2">
      <SectionHeader number="06" label="Room is open" />
      <div
        className="flex items-center justify-between gap-5 rounded-2xl border border-[rgba(196,181,253,.18)] px-[30px] py-[26px]"
        style={{
          backgroundImage: "linear-gradient(120deg,rgba(124,58,237,.2),rgba(255,255,255,.02) 70%)",
        }}
      >
        <div className="flex flex-col gap-2">
          <h3 className="font-serif text-[26px] leading-[1.06] text-white">
            Watch parties are coming to StreamFree
          </h3>
          <p className="text-[12px] text-white/50">
            Sync playback with friends and react together, in real time — coming soon.
          </p>
        </div>
        <span
          aria-disabled="true"
          className="flex h-11 flex-none items-center rounded-full border border-white/20 bg-white/8 px-6 text-[13px] font-medium text-white/70"
        >
          Coming soon
        </span>
      </div>
    </section>
  );
}
