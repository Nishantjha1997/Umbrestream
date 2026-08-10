"use client";

/**
 * The desktop-only centred panel for the player's overlays — servers,
 * episodes (`DESKTOP_SPEC.md` §I: *"There are no sheets or drawers on
 * desktop... handled by the shared centred panel"*). Phone keeps
 * `VaulDrawer`'s bottom sheet for the same content; this is what desktop
 * gets instead, mirroring the "sheets vs. panels" split `DetailModal.tsx`
 * already established for the detail route (Phase 2, §6).
 *
 * Portal to `document.body` for the same reason `DetailModal.tsx` is: the
 * player shell renders inside `template.tsx`'s animated wrapper, and any
 * ancestor with a `transform` (framer-motion always sets one, even an
 * identity matrix at rest) creates a new containing block for
 * `position: fixed` descendants — without the portal this panel would be
 * positioned relative to that wrapper's box instead of the viewport.
 */

import { Close } from "@/utils/icons";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export interface PlayerPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** 420 for servers, wider for an episode grid. */
  maxWidthClassName?: string;
  children: ReactNode;
}

export default function PlayerPanel({
  open,
  onClose,
  title,
  maxWidthClassName = "max-w-[420px]",
  children,
}: PlayerPanelProps) {
  // The portal target doesn't exist during SSR/the first render — standard
  // one-tick-late mount guard for `createPortal`, same as `DetailModal.tsx`.
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-85 hidden items-center justify-center p-10 md:flex">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 z-0 bg-[rgba(4,4,7,.68)] backdrop-blur-[8px]"
      />
      <div
        className={`relative z-10 max-h-full w-full overflow-y-auto rounded-[18px] border border-white/10 bg-[rgba(19,18,23,.96)] p-7 shadow-[0_40px_100px_-20px_rgba(0,0,0,.9)] ${maxWidthClassName}`}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="font-serif text-[28px] leading-none text-white">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="glass-control flex size-8 shrink-0 items-center justify-center rounded-full border focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-hidden"
          >
            <Close size={13} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
