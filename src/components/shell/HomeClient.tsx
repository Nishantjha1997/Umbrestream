"use client";

import DesktopHome from "@/components/shell/desktop/home/DesktopHome";
import PhoneHome from "@/components/shell/phone/home/PhoneHome";
import { useCallback, useSyncExternalStore } from "react";

const PHONE_QUERY = "(max-width: 767px)";

function subscribeToViewport(onChange: () => void) {
  const media = window.matchMedia(PHONE_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getPhoneSnapshot() {
  return window.matchMedia(PHONE_QUERY).matches;
}

export default function HomeClient({ initialIsPhone }: { initialIsPhone: boolean }) {
  const getServerPhoneSnapshot = useCallback(() => initialIsPhone, [initialIsPhone]);
  const isPhone = useSyncExternalStore(
    subscribeToViewport,
    getPhoneSnapshot,
    getServerPhoneSnapshot,
  );
  return isPhone ? <PhoneHome /> : <DesktopHome />;
}
