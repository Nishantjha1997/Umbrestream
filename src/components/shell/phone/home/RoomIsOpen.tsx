"use client";

/**
 * `PHONE_SPEC.md` §G "06 — Room is open" — inset violet-gradient card, the
 * only section whose `<section>` itself carries the horizontal padding.
 *
 * Watch parties are not a real feature yet — no presence infrastructure
 * exists anywhere in `src/actions/` or `src/hooks/`
 * (`SONNET_IMPLEMENTATION_PLAN.md` §13: "design-complete, functionally a
 * 'coming soon' state for now"). The mock's avatar stack, named presence
 * line ("Aarav, Meera and 1 more are in") and specific countdown ("in
 * twelve minutes") are fabricated social proof for a feature that isn't
 * live, so none of it is ported. This renders an honest teaser instead: a
 * headline, one truthful supporting line, and an inert "Coming soon" pill
 * that does not pretend to be a working control.
 */

export default function RoomIsOpen() {
  return (
    <section className="flex flex-col gap-[15px] px-5">
      {/* Not <SectionHeader> here: that component applies its own px-5, and
          this section's padding already lives on the <section> itself — the
          one place spec puts it there instead of on the header row. */}
      <div className="flex items-baseline gap-[11px]">
        <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-accent">06</span>
        <h2 className="m-0 text-[10.5px] font-semibold tracking-[0.24em] text-white/48 uppercase">
          Room is open
        </h2>
      </div>

      <div className="flex flex-col gap-[14px] rounded-[16px] border border-accent/18 bg-[linear-gradient(150deg,rgba(124,58,237,.2),rgba(255,255,255,.025)_64%)] p-[18px]">
        <p className="m-0 font-serif text-[25px] leading-[1.06] tracking-[-0.01em] text-balance">
          Watch parties are coming to StreamFree
        </p>
        <p className="m-0 text-[11.5px] text-white/50">
          Sync playback with friends and react together, in real time — coming soon.
        </p>
        <span
          aria-disabled="true"
          className="flex h-10 w-fit items-center justify-center rounded-full border border-white/20 bg-white/8 px-4 text-[13px] font-medium text-white/70"
        >
          Coming soon
        </span>
      </div>
    </section>
  );
}
