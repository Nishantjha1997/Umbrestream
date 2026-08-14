# StreamFree — Movies, TV Shows & Anime

StreamFree is a personal movies, TV shows, and anime discovery platform. It offers a seamless
browsing experience for discovering, searching, and tracking a vast library of content.

For the current production status, architecture, playback providers, Android build steps, and
handoff context, read [STREAMFREE_HANDOFF.md](STREAMFREE_HANDOFF.md).

## Key Features

- **🌗 Light and Dark Mode**: Both light and dark modes, adapting to user preference.
- **🧭 Discover Content**: Browse popular, trending, and upcoming movies and TV shows.
- **⛩️ Anime**: A dedicated anime section backed by AniList — proper studios, format, and episode
  metadata rather than a generic "Animation" genre filter.
- **🔎 Powerful Search**: Find specific titles, actors, or genres quickly.
- **📂 Personal Library**: Build a watchlist and track watch history, synced across devices via
  Supabase.
- **💻📱 Responsive UI**: Consistent experience across desktop, tablet, and mobile.
- **📲 Progressive Web App**: Installable, with native-like behavior.
- **🙍‍♂️ User Accounts**: Sign in for a personalized watchlist and history.

## Technologies Used

- **Next.js 16 App Router**
- **Tailwind CSS 4**
- **HeroUI** — accessible, customizable React components
- **TypeScript**
- **TanStack Query** — data fetching and caching
- **The Movie Database (TMDB) API** — movie and TV metadata
- **AniList API** — anime metadata
- **Supabase** — authentication and database

## Getting Started

See [SETUP.md](SETUP.md) for full environment configuration (TMDB, Supabase, and everything
required to run this locally). Once configured:

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the git workflow and known environment notes.

## Acknowledgements

StreamFree's foundation is built on [cinextma](https://github.com/wisnuwirayuda15/cinextma) by
Wisnu Wirayuda, used under the MIT License (see [LICENSE](LICENSE)).
