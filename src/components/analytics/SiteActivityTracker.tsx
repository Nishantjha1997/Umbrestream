"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackUmbraEvent } from "@/lib/analytics/client";

function deviceClass(): string {
  if (typeof window === "undefined") return "unknown";
  return window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop";
}

export default function SiteActivityTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    trackUmbraEvent("page_view", { device: deviceClass() });
  }, [pathname]);

  return null;
}
