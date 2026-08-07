/**
 * Required for the `@modal` parallel-route slot (Phase 2, §6): without a
 * `default.tsx`, any hard navigation/refresh to a path that isn't one of the
 * intercepted routes below would 404 the slot instead of rendering nothing.
 * Every direct page load — including direct navigation to `/movie/[id]`
 * itself — falls through to this.
 */
export default function Default() {
  return null;
}
