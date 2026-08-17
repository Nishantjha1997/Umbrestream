"use client";

import { trackUmbraEvent } from "@/lib/analytics/client";
import { Button, Card } from "@heroui/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function PwaUpdateNotice() {
  const pathname = usePathname();
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [ready, setReady] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const reportedReadyRef = useRef(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let disposed = false;
    const observe = (next: ServiceWorkerRegistration) => {
      if (disposed) return;
      setRegistration(next);
      const showReady = () => {
        setReady(true);
        if (reportedReadyRef.current) return;
        reportedReadyRef.current = true;
        trackUmbraEvent("pwa_update_ready", {});
      };
      if (next.waiting) showReady();
      const installing = next.installing;
      installing?.addEventListener("statechange", () => {
        if (installing.state === "installed" && navigator.serviceWorker.controller) {
          showReady();
        }
      });
    };

    navigator.serviceWorker.getRegistration().then((next) => {
      if (next) observe(next);
    });
    return () => {
      disposed = true;
    };
  }, []);

  if (!ready || !registration || pathname.includes("/player")) return null;

  const accept = () => {
    trackUmbraEvent("pwa_update_accepted", {});
    setAccepting(true);
    const waiting = registration.waiting;
    if (!waiting) {
      window.location.reload();
      return;
    }
    const reload = () => window.location.reload();
    navigator.serviceWorker.addEventListener("controllerchange", reload, { once: true });
    waiting.postMessage({ type: "SKIP_WAITING" });
  };

  return (
    <Card
      role="status"
      className="fixed right-3 bottom-3 z-[75] w-[min(370px,calc(100vw-24px))] gap-3 border border-violet-200/20 bg-[#15121d]/95 p-4 shadow-2xl backdrop-blur-xl"
    >
      <div>
        <p className="font-semibold text-white">A new StreamFree version is ready</p>
        <p className="mt-1 text-xs leading-5 text-white/60">
          Reload when convenient to receive the latest fixes. Your account and library stay intact.
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="light" onPress={() => setReady(false)} isDisabled={accepting}>
          Later
        </Button>
        <Button size="sm" color="primary" onPress={accept} isLoading={accepting}>
          Reload
        </Button>
      </div>
    </Card>
  );
}
