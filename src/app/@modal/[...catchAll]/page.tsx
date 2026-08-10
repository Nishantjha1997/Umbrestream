/**
 * Clear the intercepted detail modal on client-side navigation to any route
 * that is not handled by one of the `(.)movie`, `(.)tv`, or `(.)anime`
 * interceptors.
 *
 * Parallel-route slots retain their last active subtree during soft
 * navigation when no matching route exists. Without this catch-all, pressing
 * Play inside a detail modal changes the URL and renders the player route
 * behind the still-mounted modal. A hard navigation works because
 * `@modal/default.tsx` is used, which is why opening Play in a new tab did not
 * reproduce the bug.
 */
export default function CatchAllModalRoute() {
  return null;
}
