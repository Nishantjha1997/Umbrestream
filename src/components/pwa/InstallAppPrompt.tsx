"use client";

import { Close, Share } from "@/utils/icons";
import { Button, Card } from "@heroui/react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISSED_AT_KEY = "umbra:pwa-install-dismissed-at";
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
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isInstalled() || wasRecentlyDismissed()) return;

    const userAgent = navigator.userAgent;
    const ios =
      /iPad|iPhone|iPod/.test(userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const safari =
      /Safari/i.test(userAgent) &&
      !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent) &&
      navigator.vendor.includes("Apple");
    const timer = window.setTimeout(() => {
      if (ios && safari) {
        setShowIosHelp(true);
        setVisible(true);
      }
    }, 6_000);

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
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

  if (!visible || pathname.includes("/player")) return null;

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
    <div className="pwa-install-safe fixed right-2 left-2 z-[70] mx-auto max-w-md sm:right-4 sm:left-auto">
      <Card className="glass-panel border-default-200/50 gap-3 border p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <Image
            src="/icons/ios/120.png"
            alt="StreamFree app icon"
            width={48}
            height={48}
            className="rounded-xl"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Install StreamFree</p>
            <p className="text-default-500 text-xs leading-relaxed">
              Open it full-screen from your home screen with faster repeat visits.
            </p>
          </div>
          <Button isIconOnly size="sm" variant="light" aria-label="Dismiss" onPress={dismiss}>
            <Close size={20} />
          </Button>
        </div>

        {showIosHelp ? (
          <div className="bg-default-100/70 flex items-center gap-2 rounded-xl px-3 py-2 text-xs">
            <Share className="text-primary shrink-0" size={22} />
            <span>
              In Safari, tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>, then
              <strong> Add</strong>.
            </span>
          </div>
        ) : (
          <Button color="primary" onPress={install} isDisabled={!installPrompt}>
            Install app
          </Button>
        )}
      </Card>
    </div>
  );
}
