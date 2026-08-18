"use client";

import { useEffect, useState } from "react";

type ProviderStatus = { configured: boolean; connected: boolean };
type AccountState = {
  authenticated: boolean;
  providers: Record<string, ProviderStatus>;
  accounts?: Array<{ provider: string; provider_username: string | null }>;
};

const labels = { anilist: "AniList", mal: "MyAnimeList" } as const;

export default function AnimeConnections() {
  const [state, setState] = useState<AccountState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("anime_connected");
    const error = params.get("anime_error");
    if (connected) setNotice(`${connected === "mal" ? "MyAnimeList" : "AniList"} connected successfully.`);
    if (error) setNotice("The anime account connection could not be completed. Check the account setup and try again.");
    void fetch("/api/anime/accounts", { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<AccountState> : null)
      .then((data) => { if (data) setState(data); })
      .catch(() => undefined);
  }, []);

  if (!state?.authenticated) return null;

  return (
    <section className="mt-4 scroll-mt-24 rounded-3xl border border-fuchsia-200/12 bg-[radial-gradient(circle_at_90%_0%,rgba(217,70,239,.12),transparent_34%),rgba(255,255,255,.03)] p-6 sm:p-8" aria-labelledby="anime-connections-title">
      <p className="text-[10px] font-semibold tracking-[0.22em] text-fuchsia-200/65 uppercase">Anime Mode</p>
      <h2 id="anime-connections-title" className="mt-2 text-xl font-semibold">Sync your anime lists</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">Connect an account to keep list progress and episode activity aligned. StreamFree stores provider tokens encrypted and never puts them in the browser.</p>
      {notice && <p role="status" className="mt-4 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-fuchsia-100/80">{notice}</p>}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {(["anilist", "mal"] as const).map((provider) => {
          const item = state.providers[provider];
          const account = state.accounts?.find((candidate) => candidate.provider === provider);
          return (
            <div key={provider} className="flex min-h-24 items-center justify-between gap-4 rounded-2xl border border-white/8 bg-black/20 p-4">
              <div className="min-w-0">
                <p className="font-semibold text-white">{labels[provider]}</p>
                <p className="mt-1 truncate text-xs text-white/45">{account?.provider_username ? `Connected as ${account.provider_username}` : item?.configured ? "Ready to connect" : "Not enabled by StreamFree yet"}</p>
              </div>
              {item?.connected ? (
                <span className="shrink-0 rounded-full border border-emerald-200/20 bg-emerald-300/10 px-3 py-2 text-xs font-semibold text-emerald-100">Connected</span>
              ) : (
                <a
                  href={item?.configured ? `/api/auth/${provider}/start?next=%2Fspace` : undefined}
                  aria-disabled={!item?.configured}
                  className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-full px-4 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-fuchsia-200/80 focus-visible:outline-none ${item?.configured ? "bg-fuchsia-200/16 text-fuchsia-50 hover:bg-fuchsia-200/26" : "cursor-not-allowed border border-white/10 text-white/30"}`}
                >
                  {item?.configured ? "Connect" : "Unavailable"}
                </a>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
