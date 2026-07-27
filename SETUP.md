# Umbra — Setup

## 1. Supabase (required — the app will not boot without it)

The env schema validates these at startup, so missing values fail fast rather
than half-working. I can't create the project for you: it needs your login.

### Create the project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a
   new project. The free tier is enough.
2. Pick a region near you — every query pays that round-trip.
3. Save the database password somewhere safe. You cannot recover it later,
   only reset it.

### Copy three values into `.env.local`

**Project Settings → API**:

| Dashboard field | Goes into | Notes |
|---|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` | Public. Safe in the browser. |
| `anon` / publishable key | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public **by design** — Row Level Security is what protects the data, not this key. |
| `service_role` key | `SUPABASE_SERVICE_ROLE_KEY` | **Bypasses RLS entirely.** Server-only. Never prefix it `NEXT_PUBLIC_`, never commit it. |

`TMDB_ACCESS_TOKEN` is already filled in.

### Apply the schema

The tables already exist as migrations in [`supabase/`](supabase/) — you don't
need to write any SQL.

```bash
npx supabase link --project-ref <your-project-ref>   # ref is in your dashboard URL
npx supabase db push
```

That creates three tables, all with Row Level Security enabled and per-user
policies so nobody can read anyone else's rows:

- **`profiles`** — display name, avatar
- **`watchlist`** — saved titles
- **`histories`** — watch progress: `media_id`, `type`, `season`, `episode`,
  `last_position`, `duration`, `completed`, unique per
  `(user_id, media_id, type, season, episode)`, with an `updated_at` trigger

That `histories` table *is* your cross-device sync. Stop at 8:32 on desktop,
open your phone, resume at 8:32 — no extra work needed.

### Enable sign-in

**Authentication → Providers**. Email is on by default. For Google, add the
client ID and secret (see `.env.example`) and add your callback URL to the
Google console.

### Run it

```bash
npm run dev
```

---

## 2. Android and iOS later, sharing this same database

**You're already set up for this**, and it's worth understanding why so you
don't accidentally break it.

Supabase is a hosted Postgres with official client SDKs for
**Swift (iOS)**, **Kotlin (Android)**, **Flutter**, and **React Native**. A
native app signs into the *same* project with the same email/Google login and
reads the same `histories` and `watchlist` rows. There is no syncing to build
and no second backend — the phone and the browser are two clients of one
database.

### The rule that keeps this true

Every piece of data the app uses must come from one of two places:

1. **Supabase** — user data. Native SDKs exist, so mobile gets it free.
2. **`/api/tmdb`** — catalogue data. Plain HTTP, so any client can call it.

That's already how the code works after the token fix. **Don't put data access
in a React Server Component that a phone can't reach.** The moment business
logic lives only inside a server-rendered page, mobile has to reimplement it.

### Picking a shell, when you get there

| Approach | What it is | Best when |
|---|---|---|
| **Capacitor** | Wraps the built web app in a native shell; real APK/IPA, native plugins available | You want one codebase and near-zero extra UI work. **Start here.** |
| **PWA → TWA** | `@ducanh2912/next-pwa` is already installed; Android can ship a PWA as a Play Store app | Fastest to Play Store. Weak on iOS — Apple limits PWAs badly. |
| **React Native / Expo** | Separate native UI, shares Supabase + the TMDB proxy | You want genuinely native feel and will maintain a second UI. |

**Recommendation: Capacitor.** With Next.js App Router the practical setup is
to deploy the web app (Vercel free tier) and have Capacitor load that URL in
its WebView, rather than trying to static-export a Server Components app.
You get one codebase, real store-shippable binaries, and native APIs when you
need them.

Rough shape when you're ready:

```bash
npm install @capacitor/core @capacitor/cli
npx cap init Umbra com.yourname.umbra
npx cap add android      # needs Android Studio
npx cap add ios          # needs a Mac + Xcode
```

Then point `server.url` in `capacitor.config.ts` at your deployed app.

**iOS reality check:** shipping to the App Store needs a Mac for the build and
a $99/year Apple Developer account. Android needs neither for sideloading an
APK — only a one-time $25 fee if you want the Play Store. So Android first is
the cheaper path.

---

## 3. Attribution — keep this intact

This project is built on [cinextma](https://github.com/wisnuwirayuda15/cinextma),
MIT licensed, **Copyright (c) 2025 Wisnu Wirayuda**.

MIT lets you do essentially anything — use, modify, sell, close-source your
additions — on **one** condition: the copyright notice and license text must
be preserved. So:

- **Do not delete or edit [`LICENSE`](LICENSE).** That single file is the whole
  obligation.
- Rebranding the UI, changing the name, and adding your own code are all fine.
- Credit the original in your README if you publish this.

Deleting the LICENSE during a rebrand is the one thing that would turn a fully
legitimate fork into infringement. It costs nothing to keep.
