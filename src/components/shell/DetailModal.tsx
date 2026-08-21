"use client";

/**
 * The chrome around an intercepted detail route (Phase 2, §6). One
 * component, not forked — the desktop-vs-phone difference here is pure CSS
 * (a centred card vs. a full-bleed passthrough), not a different
 * composition, so it does not belong in `src/components/shell/{phone,desktop}/`.
 *
 * - **Desktop**: a centred modal, `max-width:940px`, over a
 *   `rgba(4,4,7,.7)` + `blur(8px)` scrim, on top of a still-mounted,
 *   still-scrolled page underneath. Closing costs nothing — that is the
 *   design's stated intent (`docs/design/DESKTOP_SPEC.md` §J), which is why
 *   there is no drag-to-dismiss ceremony here the way there is on
 *   `VaulDrawer`'s sheets: a scrim click or the X is enough.
 * - **Phone**: no scrim, no card — `fixed inset-0`, filling the viewport so
 *   it reads exactly like a real page (`docs/design/DESKTOP_SPEC.md` §J:
 *   "the intercepting slot simply renders full-bleed instead of centred —
 *   same route, different presentation").
 *
 * Every render of this component is inside an *intercepted* route (see
 * `src/app/@modal/(.)movie/[id]/page.tsx` and its `tv`/`anime` siblings) —
 * `router.back()` is correct for closing because navigating here always
 * pushed a history entry; back removes the overlay and restores whatever
 * was underneath without a data refetch.
 *
 * Rendered through a portal into `document.body`, not in place. The `@modal`
 * slot renders underneath the root `template.tsx`'s `motion.div`
 * (`RouteTemplate`) — confirmed by walking the DOM in a live browser check —
 * and `motion`/`framer-motion` always sets a `transform` on that div, even
 * an identity one at rest. Per the CSS spec, any computed `transform` other
 * than `none` on an ancestor creates a new containing block for
 * `position: fixed` descendants, so without the portal this component's
 * `fixed inset-0` would be positioned relative to that div's box instead of
 * the viewport — which is exactly the bug a live check caught: the modal
 * rendered thousands of pixels down the page instead of pinned to the
 * screen. The portal escapes the whole subtree.
 */

import { Close } from "@/utils/icons";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type PropsWithChildren } from "react";
import { createPortal } from "react-dom";

export default function DetailModal({ children }: PropsWithChildren) {
  const router = useRouter();
  const close = useCallback(() => router.back(), [router]);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  // The element that had focus before the modal opened (the card the user
  // clicked). Restored on unmount so keyboard users land back where they were
  // — the page underneath stays mounted and scrolled, so this is stable.
  const restoreFocusRef = useRef<Element | null>(null);

  // The portal target (`document.body`) doesn't exist during SSR/the first
  // render, so this mounts one tick late on purpose — there is nothing to
  // portal into before then. This is the standard mount-guard for
  // `createPortal`; there is no external system to synchronize with here,
  // so the usual "don't setState in an effect" advice doesn't apply.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Closing the underlying route (browser back, or a client navigation away)
  // while the modal is mounted must not leave the page unscrollable — see
  // the matching cleanup in the effect below.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Dialog behavior: remember the opener, move focus to the close control,
  // restore it when the modal unmounts, and treat Escape as "back" — the same
  // semantic the scrim click and the X already have.
  useEffect(() => {
    restoreFocusRef.current = document.activeElement;
    closeButtonRef.current?.focus();
    return () => {
      const restoreTo = restoreFocusRef.current;
      if (restoreTo instanceof HTMLElement && restoreTo.isConnected) restoreTo.focus();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [close]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-80 overflow-y-auto md:flex md:items-center md:justify-center md:overflow-y-hidden md:p-8">
      {/* Desktop-only scrim. Phone has none — it's full-bleed, there is
          nothing behind it to scrim. Kept out of the tab order; the X below
          is the single focusable close control. */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={close}
        className="fixed inset-0 hidden md:block md:bg-[rgba(4,4,7,.7)] md:backdrop-blur-[8px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Details"
        className="relative min-h-dvh w-full overflow-x-clip bg-[#0a090d] md:max-h-full md:min-h-0 md:w-auto md:max-w-[940px] md:overflow-y-auto md:rounded-[18px] md:border md:border-white/10 md:bg-[#131217]"
      >
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close"
          onClick={close}
          className="glass-control safe-detail-close absolute z-10 flex size-11 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
        >
          <Close size={22} />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}
