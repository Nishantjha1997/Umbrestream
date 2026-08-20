"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Notification = { id: number; anilist_id: number; title: string; episode: number; read_at: string | null };

export default function AnimeNotifications() {
  const [open, setOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const refresh = useCallback(() => {
    void fetch("/api/anime/notifications", { cache: "no-store" })
      .then((response) => (response.ok ? (response.json() as Promise<{ notifications: Notification[]; unreadCount: number }>) : null))
      .then((data) => {
        if (data) {
          setAuthenticated(true);
          setItems(data.notifications);
          setUnread(data.unreadCount);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const interval = window.setInterval(refresh, 15 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const markAllRead = () => {
    void fetch("/api/anime/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    }).then(refresh);
  };

  if (!authenticated) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-label={unread ? `${unread} new anime episodes` : "Anime episode notifications"}
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex min-h-11 items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 text-[12px] font-medium text-white/75 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
      >
        Notifications
        {unread > 0 && (
          <span className="flex min-w-5 items-center justify-center rounded-full bg-violet-300 px-1.5 py-0.5 text-[10px] font-bold text-[#1b1021]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Anime episode notifications"
          className="absolute top-14 right-0 z-50 w-[min(90vw,360px)] rounded-2xl border border-white/12 bg-[#18121d] p-3 shadow-2xl shadow-black/50"
        >
          <div className="flex items-center justify-between gap-3 px-2 py-1">
            <p className="text-sm font-semibold text-white">New episodes</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-violet-300 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
              >
                Mark all read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="px-2 py-5 text-sm text-white/70">You are up to date.</p>
          ) : (
            <div className="mt-2 grid gap-1">
              {items.slice(0, 8).map((item) => (
                <Link
                  key={item.id}
                  href={`/anime/${item.anilist_id}`}
                  onClick={() => {
                    if (!item.read_at) {
                      void fetch("/api/anime/notifications", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: item.id }),
                      });
                    }
                  }}
                  className="rounded-xl px-2 py-2.5 text-left hover:bg-white/7 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
                >
                  <p className="text-sm text-white">{item.title}</p>
                  <p className="mt-0.5 text-xs text-white/70">Episode {item.episode} is available</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
