"use client";

import DesktopHome from "@/components/shell/desktop/home/DesktopHome";
import PhoneHome from "@/components/shell/phone/home/PhoneHome";
import { useSyncExternalStore } from "react";

const PHONE_QUERY = "(max-width: 767px)";

function subscribeToViewport(onChange: () => void) {
  const media = window.matchMedia(PHONE_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getPhoneSnapshot() {
  return window.matchMedia(PHONE_QUERY).matches;
}

function getServerPhoneSnapshot() {
  return false;
}

/**
 * Keep one home tree mounted. The previous CSS-only fork rendered phone and
 * desktop homes simultaneously, which duplicated auth/history/recommendation
 * queries and made a cold home feel heavier than it needed to be.
 */
export default function HomePage() {
  const isPhone = useSyncExternalStore(subscribeToViewport, getPhoneSnapshot, getServerPhoneSnapshot);
  return isPhone ? <PhoneHome /> : <DesktopHome />;
}
