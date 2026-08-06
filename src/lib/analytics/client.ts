import type { AnalyticsEventName, AnalyticsProperties } from "./events";

const SESSION_KEY = "umbra:analytics-session:v1";

function getSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;

    const next = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, next);
    return next;
  } catch {
    return "ephemeral";
  }
}

/** Fire-and-forget first-party metrics. Analytics must never delay playback or navigation. */
export function trackUmbraEvent(
  eventName: AnalyticsEventName,
  properties: AnalyticsProperties = {},
): void {
  if (typeof window === "undefined") return;

  const payload = JSON.stringify({
    eventName,
    sessionId: getSessionId(),
    route: window.location.pathname,
    properties,
  });

  void fetch("/api/analytics/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    credentials: "same-origin",
    keepalive: true,
  }).catch(() => undefined);
}
