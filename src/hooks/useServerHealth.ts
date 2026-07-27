"use client";

import { useState, useEffect } from "react";
import { PlayersProps } from "@/types";

export type ServerHealthStatus = "checking" | "online" | "slow" | "offline";

export interface ServerHealthMap {
  [index: number]: ServerHealthStatus;
}

export function useServerHealth(players: PlayersProps[], enabled: boolean = true): ServerHealthMap {
  const [healthMap, setHealthMap] = useState<ServerHealthMap>(() => {
    const initial: ServerHealthMap = {};
    players.forEach((_, idx) => {
      initial[idx] = "checking";
    });
    return initial;
  });

  useEffect(() => {
    if (!enabled || !players.length) return;

    let isMounted = true;

    players.forEach((player, index) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const startTime = performance.now();

      // Extract domain for lightweight head/cors ping
      let pingUrl: string = player.source;
      try {
        const parsed = new URL(player.source);
        pingUrl = `${parsed.protocol}//${parsed.hostname}`;
      } catch {
        pingUrl = player.source;
      }

      fetch(pingUrl, {
        method: "HEAD",
        mode: "no-cors", // no-cors mode allows cross-origin domain responsiveness checks without throwing CORS errors
        signal: controller.signal,
      })
        .then(() => {
          clearTimeout(timeoutId);
          if (!isMounted) return;
          const latency = performance.now() - startTime;
          setHealthMap((prev) => ({
            ...prev,
            [index]: latency > 1200 ? "slow" : "online",
          }));
        })
        .catch((err) => {
          clearTimeout(timeoutId);
          if (!isMounted) return;
          setHealthMap((prev) => ({
            ...prev,
            [index]: err.name === "AbortError" ? "offline" : "online", // no-cors opaque response or network success
          }));
        });
    });

    return () => {
      isMounted = false;
    };
  }, [players, enabled]);

  return healthMap;
}
