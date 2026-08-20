"use client";

import { Close, Share } from "@/utils/icons";
import { Button, Card } from "@heroui/react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

type PromptMode = "android" | "web" | "ios";

const DISMISSED_AT_KEY = "streamfree:install-prompt-dismissed-at:v3";
const DISMISS_FOR_MS = 14 * 24 * 60 * 60 * 1000;

const isInstalled = (): boolean =>
  window.matchMedia("(display-mode: standalone)").matches ||
  Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

const wasRecentlyDismissed = (): boolean => {
  try {
    const dismissedAt = Number(localStorage.getItem(DISMISSED_AT_KEY));
    return Number.isFinite(dismissedAt) && Date.now() - dismissedAt < DISMISS_FOR_MS;
  } catch {
    return false;
  }
};

export default function InstallAppPrompt() {
  const pathname = usePathname();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<PromptMode | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isInstalled() || wasRecentlyDismissed()) return;

    const userAgent = navigator.userAgent;
    const android = /Android/i.test(userAgent);
    const ios =
      /iPad|iPhone|iPod/.test(userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const safari =
      /Safari/i.test(userAgent) &&
      !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent) &&
      navigator.vendor.includes("Apple");

    if (android) {
      const androidTimer = window.setTimeout(() => {
        setMode("android");
        setVisible(true);
      }, 4_500);
      return () => window.clearTimeout(androidTimer);
    }

    const timer = window.setTimeout(() => {
      if (ios && safari) {
        setMode("ios");
        setVisible(true);
      }
    }, 6_000);

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setMode("web");
      setVisible(true);
    };
    const handleInstalled = () => setVisible(false);

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (
    !visible ||
    !mode ||
    pathname === "/app" ||
    pathname.startsWith("/app/") ||
    pathname.includes("/player")
  )
    return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
    } catch {
      // Storage can be unavailable in private browsing; hiding still works for this page.
    }
    setVisible(false);
  };

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setVisible(false);
    setInstallPrompt(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      className="pwa-install-safe fixed right-2 left-2 z-[70] mx-auto max-w-[360px] sm:right-4 sm:left-auto"
    >
      <Card className="glass-panel gap-3 border border-white/12 bg-[#121016]/88 p-4 shadow-[0_24px_70px_-28px_rgba(0,0,0,.95)] backdrop-blur-2xl">
        <div className="flex items-start gap-3">
          <Image
            src="/icons/ios/120.png"
            alt="StreamFree app icon"
            width={48}
            height={48}
            className="rounded-xl"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-white">
              {mode === "android" ? "StreamFree is on Android" : "Install StreamFree"}
            </p>
            <p className="text-default-500 text-xs leading-relaxed">
              {mode === "android"
                ? "Meet the dedicated Android app, built with its own mobile interface."
                : "Open it full-screen from your home screen with faster repeat visits."}
            </p>
          </div>
          <Button isIconOnly size="sm" variant="light" aria-label="Dismiss" onPress={dismiss}>
            <Close size={20} />
          </Button>
        </div>

        {mode === "android" ? (
          <Link
            href="/app"
            className="flex h-10 items-center justify-center rounded-xl bg-violet-200 px-4 text-sm font-bold text-violet-950 transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-violet-300/70 focus-visible:outline-none"
          >
            View Android app
          </Link>
        ) : mode === "ios" ? (
          <div className="bg-default-100/70 flex items-center gap-2 rounded-xl px-3 py-2 text-xs">
            <Share className="text-primary shrink-0" size={22} />
            <span>
              In Safari, tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>, then
              <strong> Add</strong>.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button color="primary" onPress={install} isDisabled={!installPrompt}>
              Install web app
            </Button>
            <Link
              href="/app"
              className="flex h-10 items-center justify-center rounded-xl border border-violet-200/18 bg-violet-400/[0.09] px-3 text-center text-xs font-semibold text-violet-100 transition-colors hover:bg-violet-400/[0.16] focus-visible:ring-2 focus-visible:ring-violet-300/70 focus-visible:outline-none"
            >
              Android app
            </Link>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
