export const ANALYTICS_EVENT_NAMES = [
  "page_view",
  "signup_started",
  "signup_completed",
  "signup_failed",
  "player_manifest_resolved",
  "player_provider_selected",
  "player_preflight_failed",
  "player_playback_started",
  "player_source_failed",
  "player_auto_fallback",
  "player_manual_switch",
  "player_source_observed",
  "player_fullscreen",
  "subtitle_selected",
  "audio_selected",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

export type AnalyticsProperties = Record<string, string | number | boolean>;
