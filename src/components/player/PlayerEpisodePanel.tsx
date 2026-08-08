"use client";

/**
 * The desktop-only centred panel for episode pickers, shared by TV and
 * Anime (Phase 6, §10 — see `PlayerPanel.tsx`'s header comment for why this
 * exists at all: `DESKTOP_SPEC.md` §I calls the phone-only episode drawer
 * "an unfinished mockup, not a design decision" and asks for a real desktop
 * affordance). This is a thin wrapper around `PlayerPanel` — it doesn't know
 * anything about `VaulDrawer`; each media type's episode sheet renders this
 * alongside its own phone drawer, following the same "both always mounted,
 * CSS picks which shows" pattern `PlayerSourceSheet.tsx` already uses for
 * servers.
 *
 * Wider than the 420px servers panel (`max-w-2xl`) because an episode grid
 * needs the room a single-column server list doesn't.
 */

import PlayerPanel from "@/components/player/PlayerPanel";
import type { ReactNode } from "react";

export interface PlayerEpisodePanelProps {
  opened: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function PlayerEpisodePanel({
  opened,
  onClose,
  title,
  children,
}: PlayerEpisodePanelProps) {
  return (
    <PlayerPanel open={opened} onClose={onClose} title={title} maxWidthClassName="max-w-2xl">
      {children}
    </PlayerPanel>
  );
}
