/**
 * Shared keyboard and single-flight rules for source controls.
 *
 * Native buttons normally synthesize click events for Enter and Space. The
 * player explicitly handles those keys so the same behavior is reliable in
 * embedded/mobile shells and so Space never scrolls the player page. The
 * single-flight helpers keep a rapid pointer + keyboard activation from
 * committing the same provider twice.
 */

export function isSourceActivationKey(key: string): boolean {
  return key === "Enter" || key === " ";
}

export function beginSourceSelection(currentSourceId: string | null, nextSourceId: string): string | null {
  return currentSourceId === null ? nextSourceId : null;
}

export function finishSourceSelection(currentSourceId: string | null, finishedSourceId: string): string | null {
  return currentSourceId === finishedSourceId ? null : currentSourceId;
}
