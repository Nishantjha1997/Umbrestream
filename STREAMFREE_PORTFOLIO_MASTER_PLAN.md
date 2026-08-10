# StreamFree Rebrand, Domains, and Nishant.top Portfolio - Master Implementation Plan

Last planning audit: 2026-08-10

Status: planning complete; implementation not started by this document.

This is the authoritative handoff for the next implementation sequence. Read this file together with `IMPLEMENTATION_PROGRESS.md` before changing code or external services. Update the progress file after every meaningful work session, even if the session ends blocked.

## 1. Approved outcome

Build and operate two separate products:

1. The existing Umbra application becomes **StreamFree**.
   - Primary production domain: `https://streamfree.online`
   - `https://www.streamfree.online` redirects to the apex domain.
   - `https://umbrestream.vercel.app` remains reachable as a secondary address.
   - The existing GitHub/Vercel deployment pipeline remains the deployment source.

2. A separate portfolio application becomes **Nishant Jha's professional home**.
   - Primary domain: `https://nishant.top`
   - `https://www.nishant.top` redirects to the apex domain.
   - The old `https://nishantjha.netlify.app` stays online during rollout and can redirect after the new portfolio is stable.
   - Projects remain independent applications. The portfolio links to them and hosts original case-study pages; it must not merge StreamFree or FlowCreate into the portfolio codebase.

## 2. Non-negotiable user decisions

- Current public role: **Executive, Founder's Office at CallHippo**.
- The website must never display Nishant's phone number in HTML, metadata, structured data, contact forms, or page copy.
- A downloadable resume may contain the phone number.
- Serve the public resume with `X-Robots-Tag: noindex, noarchive` so search engines do not index the phone number inside the PDF.
- Nishant built/owned the featured projects end to end and may be described accordingly.
- GitLab Access Automation impact: reduced the normal access-request turnaround time from up to 24 hours to a maximum of 30 minutes for eligible requests.
- YouTube Scripto-Scribe is the final task and lowest priority. Do not add it to the portfolio as a live project until real transcript extraction works in a Vercel production deployment.
- Keep admin access restricted to `nishantjha31@gmail.com`.
- Do not add ad blocking, iframe sandboxing, DNS ad filtering, popup interception, provider-page detection, or automatic fallback behavior that can damage playback reliability.
- Do not refactor or reorder player providers as part of the rebrand/portfolio scope.
- Preserve the existing MIT attribution and `LICENSE` file.

## 3. Verified current state

### StreamFree/Umbra checkout

- Repository: `C:\Users\DELL_\OneDrive\Desktop\Projects\Projects\My Web Sites\umbra`
- GitHub: `https://github.com/Nishantjha1997/Umbrestream`
- Audited branch/commit: clean `main` at `b96f83c`.
- The checkout has no `.vercel/project.json`; it is not locally linked to a Vercel project.
- Existing project notes state that GitHub `main` auto-deploys to Vercel.
- Vercel Analytics and Speed Insights are already installed.
- First-party analytics use the Supabase table `umbra_events`.
- Public branding is spread across metadata, manifest, PWA copy, legal pages, email templates, headers, footers, sharing copy, admin labels, and Capacitor configuration.
- The current application uses a shared `PlayerShell`; defaults are Movie Filmu, TV VidKing, and Anime AniLink Sub. This plan does not change them.

### Domains

- `streamfree.online` currently resolves to a Namecheap parking address.
- `www.streamfree.online` currently points to Namecheap parking.
- Replace only the parking records after Vercel displays the exact required records.
- Do not guess Vercel IP addresses or verification records.

### GitLab Access Automation

- Local folder: `C:\Users\DELL_\OneDrive\Desktop\Projects\Projects\Gitlab_Automate_Latestcode`
- The folder is on `feature/2fa-verification` and contains uncommitted user work. Never reset, discard, overwrite, commit, or push those changes as part of the portfolio work.
- Its Git configuration contains an embedded GitLab credential. Never print, copy, commit, or use that credential. Ask the owner before rotating it because rotation may affect an active internal workflow. Before any future push from that repository, replace credential-bearing remote URLs with credential-free URLs and authenticate through a secure credential manager.
- Some source files may contain credential-like values. The portfolio must use only sanitized documentation and screenshots, never production configuration or source code.

### Claude Usage Uploader

- Public releases repository: `https://github.com/Nishantjha1997/claude-uploader-releases`
- It is a release/binary repository; the Git tree contains only an inadequate `readme.md` with `test`.
- Public releases include Windows, Linux, macOS Intel, and macOS Apple Silicon binaries, checksums, repair scripts, update support, background health behavior, and smoke-gated release packaging.
- The portfolio may link to the releases repository only after its README is professionally rewritten without exposing private source code, endpoints, tokens, company data, or internal user information.

### YouTube Scripto-Scribe

- Repository: `https://github.com/Nishantjha1997/youtube-scripto-scribe`
- Current stack: Vite, React, TypeScript, Tailwind, shadcn/Radix UI, and Framer Motion.
- Current transcript code is not production-ready: it calls a third-party site from the browser, its Innertube path is unimplemented, and every failure silently returns mock transcript data while the UI reports success.
- Metadata still says `Lovable Generated Project`, includes a Lovable image and Twitter identity, and loads an external GPT Engineer script.
- README is empty.
- Do not deploy this state as a working portfolio project.

## 4. Execution rules for any implementer

1. Start every session by reading this file and the newest section of `IMPLEMENTATION_PROGRESS.md`.
2. Record the current branch, commit, working-tree state, and external-service state before changing anything.
3. Never reset or discard user changes. Do not use destructive Git commands.
4. Work on one project/repository at a time. Do not place portfolio code in the StreamFree repository.
5. Never store browser cookies, passwords, API tokens, Vercel tokens, Namecheap credentials, Supabase service keys, GitLab tokens, or `.env` files in Git.
6. Use preview deployments before production changes.
7. Separate code deployment from DNS/primary-domain switching so rollback remains possible.
8. After each phase, update `IMPLEMENTATION_PROGRESS.md` with completed work, verification evidence, commit SHA, deployed URL, and remaining blockers.
9. Use small scoped commits. Do not combine the StreamFree rebrand, portfolio creation, and YouTube repair in one commit or repository.
10. Do not claim a project feature or metric unless it appears in the supplied resume, verified documentation, live product, public release metadata, or an explicit user statement.

## 5. Phase 0 - Safety checkpoint and deployment identification

Purpose: prevent linking or modifying the wrong Vercel project.

1. Confirm the StreamFree/Umbra checkout remains clean and record the current commit.
2. Confirm `umbrestream.vercel.app` opens the expected production application.
3. In the logged-in Vercel account, locate the project by its assigned production domain, not by guessing a project name.
4. Verify the Vercel team/account, connected GitHub repository, production branch, latest deployment commit, environment variables, and existing domains.
5. Because the checkout is not linked, do not run a command that auto-creates a new Vercel project.
6. If CLI access is needed, run identity/team checks first and explicitly link the checkout to the already-verified project. Never accept a prompt that proposes creating a duplicate project.
7. Capture the current domain and deployment settings in `IMPLEMENTATION_PROGRESS.md`; do not copy secrets.

Exit criteria:

- The exact existing Vercel project and team are known.
- The production deployment is confirmed to come from `Nishantjha1997/Umbrestream` `main`.
- No duplicate Vercel project has been created.

## 6. Phase 1 - Configure streamfree.online before rebranding

This is the first external implementation phase, as requested.

1. In Vercel Project Settings -> Domains, add:
   - `streamfree.online`
   - `www.streamfree.online`
2. Do not make the new domain primary yet. Do not redirect the old Vercel domain yet.
3. Copy the exact Vercel DNS requirements shown for the apex, `www`, and any ownership-verification TXT record.
4. In Namecheap Advanced DNS:
   - Remove the Namecheap parking A record for the apex only after Vercel's required apex record is known.
   - Remove the `www` parking CNAME only after Vercel's required `www` record is known.
   - Add the exact Vercel records.
   - Leave unrelated MX, email, TXT, verification, and security records untouched.
5. Wait for Vercel to show valid configuration and issue SSL certificates.
6. Verify both hostnames over HTTPS. At this point they may still show Umbra branding; that is temporary.
7. Keep `umbrestream.vercel.app` assigned and working.

Exit criteria:

- `streamfree.online` resolves to the verified Vercel project.
- `www.streamfree.online` resolves and is ready to redirect to the apex.
- SSL is valid.
- The existing Vercel address still works.
- The new domain is attached but is not yet the canonical/primary production identity.

Rollback:

- Restore the recorded Namecheap parking records only if Vercel attachment fails and cannot be corrected.
- Never delete the Vercel project or production deployment during DNS troubleshooting.

## 7. Phase 2 - Build the StreamFree brand system

Create an original StreamFree identity, not a copied mark.

Approved logo direction:

- Compact interlocking `SF` monogram inside a rounded square or continuous ribbon.
- The `F` terminal may create a subtle play-triangle/film-frame negative space.
- Primary palette: near-black background, off-white foreground, restrained electric mint/ice-blue accent.
- It must remain recognizable at 16x16 and work in monochrome.

Deliverables:

- Source SVG monogram.
- Horizontal `SF + StreamFree` wordmark.
- Light, dark, and monochrome variants.
- `favicon.ico`, 16px and 32px PNGs.
- Apple touch icon (180px).
- PWA icons (192px and 512px), including a maskable version.
- Social/OG image.
- A short brand-token definition for colors, clear space, and minimum size.

Do not delete the old assets until every reference has moved to the new set and a rollback commit exists.

## 8. Phase 3 - Rebrand the existing application

### 8.1 Centralize identity and canonical URL

1. Make `src/config/site.tsx` the main public identity source.
2. Add a validated site URL environment value with production fallback `https://streamfree.online`.
3. Remove independent hard-coded production URLs from:
   - `src/app/layout.tsx`
   - `src/app/robots.ts`
   - `src/app/sitemap.ts`
4. Generate metadata, canonical URLs, sitemap entries, robots host, Open Graph data, and structured data from the shared configuration.
5. Use `StreamFree - Movies, TV Shows & Anime` or a similarly accurate title. Avoid keyword stuffing and unverifiable superlatives.
6. Keep `Umbra Stream` only as a temporary `alternateName`/migration keyword where useful; remove it from visible UI.

### 8.2 Replace public branding

Update, at minimum:

- `src/config/site.tsx`
- `src/app/layout.tsx`
- `src/app/robots.ts`
- `src/app/sitemap.ts`
- `public/manifest.json`
- `src/components/ui/other/BrandLogo.tsx`
- `src/components/ui/layout/Footer.tsx`
- `src/app/dmca/page.tsx`
- `src/config/disclaimer.ts`
- `src/components/ui/overlay/Disclaimer.tsx`
- `src/components/pwa/InstallAppPrompt.tsx`
- `src/app/space/page.tsx`
- desktop/phone search labels and home copy
- About/FAQ text
- sharing text and hashtags
- admin headings and back links
- sports/preview copy
- provider observer user-agent text
- Supabase confirmation/recovery email templates
- `capacitor.config.json` app name and hosted URL

Search the full tracked repository case-insensitively for `Umbra`, `Umbra Stream`, and `umbrestream` after the manual pass. Classify every remaining match as public identity, compatibility/internal identifier, historical documentation, or required attribution.

### 8.3 Preserve compatibility for one release

Do not rename these during the first public rebrand unless a migration is implemented and tested:

- Supabase table `umbra_events`.
- Local-storage/session keys beginning with `umbra:`.
- `NEXT_PUBLIC_UMBRA_UI_V2`.
- Internal analytics function names such as `trackUmbraEvent`.
- Existing database migrations and historical handoff documents.

Changing public labels while preserving these internal contracts prevents data loss, broken sessions, and deployment regressions. A later cleanup may dual-read old/new storage keys and migrate database naming separately.

### 8.4 Legal, PWA, authentication, and analytics

- Rebrand DMCA/disclaimer text accurately. Do not state that a notice guarantees legal safety.
- Prefer a domain email alias such as `dmca@streamfree.online` if forwarding can be configured; otherwise keep the existing reporting email.
- Update manifest names, theme colors, icons, install copy, and share targets.
- Bump PWA/cache identity so returning users do not remain trapped on stale Umbra assets. Verify service-worker update behavior explicitly.
- Add `https://streamfree.online/**`, `https://www.streamfree.online/**`, and the retained Vercel domain to allowed Supabase redirect URLs.
- If Turnstile/domain restrictions are enabled, add both StreamFree hostnames.
- Keep `SUPABASE_SERVICE_ROLE_KEY` and TMDB credentials server-only.
- Keep Vercel Analytics, Speed Insights, and first-party analytics operational. Relabel the admin UI but do not rename its database table in this phase.
- Keep the exact admin-email authorization unchanged.

## 9. Phase 4 - Verify, push, deploy, and switch primary domain

Local checks before committing:

1. `npm run test:player-sources`
2. `npm run typecheck`
3. focused ESLint for changed files, then full lint if practical
4. `npm run build`
5. `npm run check:leak`
6. `git diff --check`
7. search built/public output for personal phone number and secrets

Required browser checks on a preview deployment:

- Home, Search, Browse, Movies, TV, Anime, Categories, About, Disclaimer, and DMCA.
- Intercepted title modal -> Play navigation.
- One Movie, one TV episode, and one Anime episode reach their player route.
- Do not change provider behavior merely because opaque iframe playback cannot be inspected.
- Login, signup, logout, password recovery, history, and `/admin` authorization.
- PWA install metadata and service-worker upgrade from an older visit.
- Responsive layouts at 375x812, 390x844, 768x1024, and 1440x900.
- No horizontal overflow, missing icons, stale Umbra labels, or mismatched favicons.
- `/robots.txt`, `/sitemap.xml`, canonical metadata, OG metadata, and DMCA page use StreamFree.
- Vercel Analytics and Speed Insights load without exposing private data.

Commit and rollout sequence:

1. Commit brand assets and identity changes in scoped commits.
2. Push `main` only after all local gates pass.
3. Wait for the GitHub-connected Vercel production deployment to become Ready.
4. Verify the deployed commit, not merely the deployment timestamp.
5. Smoke-test `streamfree.online`, `www.streamfree.online`, and `umbrestream.vercel.app`.
6. Make `streamfree.online` the primary/canonical domain.
7. Configure `www.streamfree.online` to redirect to the apex.
8. Keep `umbrestream.vercel.app` reachable. All pages on the old host should declare canonical URLs on `streamfree.online` to avoid duplicate indexing.
9. Submit `https://streamfree.online/sitemap.xml` in Google Search Console after verification.

Exit criteria:

- StreamFree branding is consistent across web, PWA, social previews, email, legal pages, and admin UI.
- New and old domains both reach a working application.
- The canonical domain is `streamfree.online`.
- Playback architecture and provider order are unchanged.
- No secret or phone number appears in page source/client bundles.

## 10. Phase 5 - Create the separate Nishant.top portfolio project

Recommended local folder:

`C:\Users\DELL_\OneDrive\Desktop\Projects\Projects\My Web Sites\nishant-portfolio`

Recommended repository:

`Nishantjha1997/nishant-portfolio`

Architecture:

- Separate Next.js TypeScript application deployed as its own Vercel project.
- Dark-first design inspired by the old black/red portfolio, with improved typography, spacing, animation, accessibility, and mobile navigation.
- Data-driven project registry so every card and case-study route comes from one typed source.
- Static content where possible; no database is needed for the first release.
- Do not add `.openai/hosting.json` unless intentionally switching away from Vercel.

Core routes:

- `/` - recruiter landing page
- `/work/flowcreate`
- `/work/streamfree`
- `/work/gitlab-access-automation`
- `/work/claude-usage-uploader`
- `/work/my-fitness-blueprint`
- `/labs/ai-tts`
- `/resume` or a controlled resume-download route
- `/contact`
- `/work/youtube-scripto-scribe` only after the final phase passes

Homepage order:

1. Hero with portrait, name, current role, one-sentence value proposition, and recruiter CTAs.
2. Evidence strip with verified impact metrics.
3. Featured public products.
4. Internal automation case studies.
5. Experience timeline.
6. Skills and operating strengths.
7. Certifications/education.
8. Resume and contact CTA.

Approved positioning:

`Nishant Jha - Executive, Founder's Office | AI Automation & Business Operations`

Do not invent CallHippo responsibilities or achievements. Until more details are supplied, show the company, approved title, and `Current`. The exact CallHippo start month/year and Sigma Solve end month/year remain required before publishing a dated experience timeline or refreshed resume.

## 11. Phase 6 - Portfolio content and project case studies

### 11.1 FlowCreate - flagship public product

Live link: `https://flowcreate-similar-dream.vercel.app/`

Describe Nishant as the end-to-end builder. Cover:

- AI-assisted professional resume creation.
- 30+ ATS-friendly templates.
- Guided content suggestions.
- Real-time editing/preview and customization.
- PDF export and privacy-conscious handling.
- Product design choices and implementation responsibilities.

Use a large live-product screenshot, `View Live Site`, and `Read Case Study`. Add a GitHub button only if a public repository is intentionally supplied.

### 11.2 StreamFree

Live link: `https://streamfree.online`

Present as an end-to-end responsive media discovery and multi-provider playback product. Cover PWA installation, Movies/TV/Anime discovery, authentication, history, responsive playback, server selection, analytics/admin, and SEO/domain work. Do not claim StreamFree hosts media files if it does not.

### 11.3 GitLab Access Automation - primary operational case study

Public impact statement:

`Automated eligible GitLab repository-access requests and reduced normal turnaround time from up to 24 hours to a maximum of 30 minutes.`

Sanitized case-study flow:

1. Project manager submits a structured request.
2. The system validates employee status, project assignment, 2FA verification, repository scope, user identity, and requested role.
3. Safe roles receive time-bound GitLab access automatically.
4. Elevated roles are escalated into an admin approval flow; Owner/Admin are never auto-granted.
5. The requester receives status email and the operational dashboard/audit trail updates.

Technologies/capabilities safe to mention:

- Google Apps Script and Google Sheets.
- GitLab, HR, Asana, and Gmail integrations.
- 30-minute trigger processing and 45-day access windows.
- Role allowlists, namespace restrictions, expiry management, and 2FA verification.
- Locking, edit-safety checks, idempotent fingerprints, retries with backoff, circuit breakers, dead-letter queue, shadow mode, audit logs, dashboards, and summary reporting.

Publication safety:

- Do not publish source code, spreadsheet IDs, real employee/requester data, company namespaces, internal emails, tokens, API endpoints, or screenshots containing production data.
- Create an original architecture diagram with generic labels.
- Treat the implementation repository as private even if a remote exists until a full secret/history audit and the employer's publication rights are confirmed.

### 11.4 Claude Usage Uploader & Telemetry System

Public repository: `https://github.com/Nishantjha1997/claude-uploader-releases`

Portfolio story:

- Cross-platform usage uploader for Windows, Linux, macOS Intel, and Apple Silicon.
- Offline-first durable outbox and reliable sync behavior.
- Idempotent uploads, signed webhook patterns, operational health controls, and a real-time admin dashboard.
- Reduced Apps Script lock collisions by 95% by separating write streams.
- Public binary releases, checksums, auto-update/repair support, and smoke-gated packaging.

Before linking recruiters to the repository:

1. Replace the `test` README with a polished product overview.
2. Explain what is public (release binaries) and what is private (source/internal infrastructure).
3. Add supported platforms, release-install links, screenshots, architecture at a safe level, privacy/security notes, checksums, and troubleshooting.
4. Keep confidential endpoints, tokens, telemetry payload samples, employee identities, and internal dashboard URLs out of the README.
5. Link the latest stable release, not a prerelease/demo tag.

### 11.5 My Fitness Blueprint

Live link: `https://myfittracker.netlify.app/`

Describe as an AI-assisted personalized fitness-planning application with workout tracking, goal setting, and progress/data analysis. Verify the live URL immediately before publishing.

### 11.6 AI Text-to-Speech Lab

Rebuild the old feature at `/labs/ai-tts`:

- Browser SpeechSynthesis as the always-available baseline.
- Optional server synthesis only when an authorized provider/key is configured.
- Local Transformers.js mode as a lazy-loaded, explicit opt-in because model downloads are large.
- Sample text, voice selection, playback/download controls, loading/progress, clear errors, and privacy/execution-location notes.
- Never claim server/local synthesis succeeded when falling back to another mode.

### 11.7 Resume, contact, and privacy

- Use the supplied Founder's Office resume as the layout/content base.
- Update the current role to CallHippo only after the date range and accurate responsibilities are supplied.
- Keep the phone number inside the downloadable resume PDF only.
- Ensure the phone number is absent from source files used to render the site, metadata, analytics payloads, JSON-LD, and contact UI.
- Serve the resume with `Content-Disposition` and `X-Robots-Tag: noindex, noarchive`.
- Public contact methods: email, LinkedIn, GitHub, and contact form.
- Add abuse controls to the contact form; do not expose mail-service credentials client-side.

## 12. Phase 7 - Portfolio SEO, domain, and launch

SEO identity:

- Title: `Nishant Jha - Founder's Office, Executive Operations & AI Automation`
- Description focused on executive operations, cross-functional delivery, AI automation, internal tools, and measurable process improvement.
- Person JSON-LD on the homepage.
- CreativeWork/SoftwareApplication structured data for public project pages.
- Sitemap, robots, canonical URLs, Open Graph images, and project-specific social cards.
- Do not include the phone number in structured data.

Deployment sequence:

1. Create a separate Vercel project connected to the portfolio repository.
2. Deploy a preview and verify all content and links.
3. Add `nishant.top` and `www.nishant.top` to that portfolio project only.
4. Add the exact Vercel-provided DNS records in Namecheap. Do not reuse StreamFree records by assumption.
5. Verify SSL and make `nishant.top` primary.
6. Redirect `www.nishant.top` to the apex.
7. Keep the old Netlify portfolio online during validation; then redirect it to `nishant.top` if the old hosting configuration is available.
8. Submit the sitemap in Google Search Console.

Portfolio acceptance criteria:

- No phone number appears in website HTML/source/metadata.
- Resume downloads correctly and is sent with noindex/noarchive headers.
- Every public project has a verified live link.
- Private case studies disclose no confidential information.
- Keyboard navigation, reduced motion, contrast, focus states, and 44px touch targets pass.
- Layout passes at 375x812, 390x844, 768x1024, and 1440x900.
- Contact and resume CTAs work.
- `nishant.top` is canonical and `www` redirects correctly.

## 13. Phase 8 - Final/lowest-priority task: repair and deploy YouTube Scripto-Scribe

Do not begin this phase until StreamFree and the portfolio are live and stable.

### 13.1 Remove misleading/demo behavior

- Delete the mock-transcript fallback from production code.
- A failed extraction must produce an explicit error state, never a success toast.
- Remove duplicate/overly permissive URL regexes and validate exactly an 11-character YouTube ID.
- Remove the external GPT Engineer script.
- Replace Lovable title, author, OG image, Twitter identity, and description.
- Write a real README with setup, architecture, limitations, privacy, and deployment instructions.

### 13.2 Add a server-side transcript contract

- The browser calls only `/api/transcript`; it must not call third-party transcript sites directly.
- Validate video ID and optional language server-side.
- Return a typed response containing language, generated/manual caption status when known, and timestamped segments.
- Use a maintained server-side public-caption extractor in a small proof-of-concept first. A Vercel Python function using `youtube-transcript-api` is an acceptable initial spike.
- Test Vercel preview behavior because YouTube may rate-limit cloud/datacenter IPs.
- If Vercel consistently returns 429/blocked responses, stop and present a documented third-party transcript API option and its pricing/key requirement for approval. Do not create paid accounts or silently scrape authenticated/private content.
- Support only public videos with available captions. Map invalid, unavailable, age-restricted/private, rate-limited, and upstream-failure cases to clear user messages.
- Add bounded response size, request timeout, caching by video/language, and basic abuse/rate controls. Do not create an unrestricted proxy.

### 13.3 Product improvements

- Language selection when multiple caption tracks are available.
- Search within transcript.
- Click timestamp to open the correct YouTube time.
- Copy all and export TXT/SRT/VTT.
- Loading, empty, unavailable, rate-limited, and retry states.
- Mobile layout, accessible form labels, keyboard behavior, and reduced motion.
- Honest product copy: do not say `any video` when captions are required.

### 13.4 Verification and deployment

Test at least:

- Standard `youtube.com/watch?v=` URL with captions.
- `youtu.be` URL.
- YouTube Shorts URL.
- Video with multiple languages.
- Video without captions.
- Invalid URL/ID.
- Private or age-restricted video.
- Upstream 429/timeout.

Run typecheck, lint, production build, browser tests, metadata check, secret scan, and preview smoke tests. Deploy to a new Vercel project only after real captions are returned on the preview. Optionally assign `scribe.nishant.top` after the project is stable. Then add the live link and case-study route to the portfolio and redeploy the portfolio.

## 14. Suggested commit boundaries

StreamFree repository:

1. `docs: add StreamFree and portfolio master plan`
2. `feat: add StreamFree brand assets and shared identity`
3. `refactor: replace public Umbra branding with StreamFree`
4. `chore: update PWA SEO legal and auth domain configuration`
5. `docs: record StreamFree production rollout`

Portfolio repository:

1. `feat: scaffold Nishant portfolio and design system`
2. `feat: add experience and recruiter landing content`
3. `feat: add public product case studies`
4. `feat: add sanitized automation case studies and AI TTS lab`
5. `chore: add SEO resume privacy and deployment configuration`
6. `docs: record nishant.top launch`

YouTube repository:

1. `fix: remove mock transcript success path`
2. `feat: add server-side transcript endpoint and typed errors`
3. `feat: add transcript search languages and exports`
4. `chore: replace generated metadata and document deployment`

## 15. Required inputs that do not block the StreamFree phases

Before the dated portfolio timeline and refreshed resume go live, obtain:

- CallHippo start month/year.
- Sigma Solve end month/year.
- Accurate public responsibilities/achievements for the CallHippo role, or approval to show title/company only.
- Confirmation of the preferred public portrait.

Do not invent these values. StreamFree domain setup and rebranding can proceed while these inputs are pending.

## 16. Final definition of done

The program is complete only when:

- `streamfree.online` is the canonical StreamFree production domain.
- `umbrestream.vercel.app` remains reachable.
- No visible Umbra branding remains except deliberate historical/alternate-name references.
- StreamFree's Movie, TV, and Anime player routes remain functional with unchanged source behavior.
- `nishant.top` is a separate recruiter-ready portfolio.
- FlowCreate, StreamFree, My Fitness Blueprint, Claude Usage Uploader, AI TTS, and the sanitized GitLab automation case study are represented accurately.
- The website does not expose Nishant's phone number; only the noindex resume contains it.
- GitLab automation secrets and company data are not published.
- The Claude releases README is recruiter-ready.
- YouTube Scripto-Scribe is included only after real captions work on Vercel and mock behavior is removed.
- Every repository has a clean documented handoff, scoped commits, and recorded production verification.
