# Working on this repo

## The loop

Never push straight to `main`. Every change goes:

```
branch  →  commit locally  →  npm run verify  →  push branch  →  PR  →  merge
```

```bash
git switch -c feat/detail-page-episodes

# ...make the change...

npm run verify          # must be green before anything leaves your machine
git add -A
git commit -m "Add episode list to TV detail pages"
git push -u origin feat/detail-page-episodes
gh pr create --fill
```

## What `npm run verify` runs

| Step | Catches |
|---|---|
| `typecheck` | Type errors. **This is the real type gate** — see the note below. |
| `lint` | ESLint (flat config; `next lint` was removed in Next 16). |
| `build` | Compile errors, bad imports, invalid route exports. |
| `check:leak` | A secret reaching `.next/static`. Fails the build if found. |

Run it before every commit you intend to push. If it isn't green, the branch
isn't ready — don't push and "fix it in the next commit."

## Known local environment fault

This machine faults with `0xC0000005` (and intermittent `EPERM` on
`uv_spawn`) whenever Node forks a child process. Practical consequences:

- **`next build` is flaky.** It crashes in whichever step spawns workers —
  sometimes compilation, sometimes the TypeScript worker, sometimes page-data
  collection. It is not deterministic and it is **not** caused by the code;
  the same commit builds fine on a healthy machine. Re-run it; it often
  passes on a second attempt.
- **`dev` and `build` are pinned to `--webpack`.** Turbopack (the Next 16
  default) crashes here immediately.
- **In-build TypeScript is disabled** via `typescript.ignoreBuildErrors` in
  `next.config.ts`, because Next runs `tsc` in a forked worker that segfaults.
  Types are still fully enforced — `npm run typecheck` runs the identical
  check in-process and passes clean. **Do not treat a green build as a green
  typecheck.** Run `npm run typecheck` explicitly.

If you fix the underlying Node install, remove `typescript.ignoreBuildErrors`
and drop the `--webpack` flags. Both exist only to work around this.

## Things that must not enter the repo

- **`_reference_do_not_ship/`** (sits outside this repo root, in the parent
  directory). It is an HTTrack mirror of a third party's live site, kept only
  as a visual reference. Do not copy code or CSS out of it, and never move it
  inside this repo — committing it would republish someone else's work.
- **Secrets.** `.env.local` is gitignored; `.env.example` is committed and
  must stay empty of real values. `check:leak` is the backstop, not the plan.
- **Adapters for services that serve unlicensed content.** The `SourceAdapter`
  extension point is deliberately generic and documented in
  [`src/lib/sources/README.md`](src/lib/sources/README.md); what gets
  registered in `bootstrap.ts` is the repo owner's call.

## Commit messages

Say what changed and why the approach was chosen. Skip restating what the
diff already shows.

```
Add fall-forward on fatal hls.js errors

Non-fatal errors recover on their own, and switching source on every one of
them made playback worse than leaving it alone.
```
