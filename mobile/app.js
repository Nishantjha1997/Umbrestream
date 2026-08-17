import { App as NativeApp } from "@capacitor/app";
import { Capacitor, CapacitorHttp } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { StatusBar, Style } from "@capacitor/status-bar";
import { createClient } from "@supabase/supabase-js";
import {
  PLAYBACK_RECOVERY_TIMEOUT_MS,
  clearPlaybackPreference,
  findNextFallbackSource,
  findPreferredSource,
  normalizeAudioVariant,
  parsePlaybackEventName,
  readPlaybackPreference,
  writePlaybackPreference,
} from "../src/lib/sources/playbackPolicy.ts";
import { toNativeHomeFeed } from "../src/lib/homeFeed/nativeAdapter.ts";
import { fetchSharedHomeFeed } from "../src/lib/homeFeed/nativeClient.ts";
import { resolveAdjacentEpisode } from "../src/lib/tv/adjacentEpisode.ts";

const BACKEND_ORIGIN = "https://streamfree.online";
const IMAGE_ORIGIN = "https://image.tmdb.org/t/p/w500";
const BACKDROP_ORIGIN = "https://image.tmdb.org/t/p/w1280";
const LOCAL_LIBRARY_KEY = "streamfree-library";
const LOCAL_HISTORY_KEY = "streamfree-history";
const RECENT_SEARCH_KEY = "streamfree-recent-searches";
const SETTINGS_KEY = "streamfree-mobile-settings-v1";
const AUTH_STORAGE_KEY = "streamfree-mobile-auth-v1";
const REGION_STORAGE_KEY = "streamfree-mobile-region-v1";
const REGION_OVERRIDE_KEY = "streamfree-region-override-v1";
const APP_VERSION = "1.3.0";
const APP_VERSION_CODE = 4;
const APP_UPDATE_MANIFEST = "/downloads/streamfree-android.json";
const TOUR_STORAGE_KEY = "streamfree-mobile-tour-v1";
const ANIME_AUDIO_KEY = "streamfree:anime-audio:v1";
const TAB_ORDER = ["home", "search", "browse", "anime", "space"];
const CACHE_TTL = 10 * 60 * 1000;

const view = document.querySelector("#view");
const app = document.querySelector("#app");
const toast = document.querySelector("#toast");
const accountButton = document.querySelector("#account-button");
const networkBanner = document.querySelector("#network-banner");
const sheetRoot = document.querySelector("#sheet-root");

const state = {
  route: "home",
  previousRoot: "home",
  browseType: "movie",
  browseFilter: "popular",
  browseGenre: "",
  browsePage: 1,
  animeSort: "TRENDING_DESC",
  detailSeason: 1,
  cache: new Map(),
  media: new Map(),
  supabase: null,
  authReady: false,
  authError: "",
  user: null,
  profile: null,
  watchlist: [],
  histories: [],
  syncBusy: false,
  player: null,
  region: null,
  update: { status: "idle", manifest: null, error: "" },
  tour: { open: false, step: 0 },
  settings: readStorage(SETTINGS_KEY, {
    dataSaver: false,
    autoplayNext: true,
    reduceMotion: false,
  }),
};

function readStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const REGION_OPTIONS = [
  ["", "Automatic"], ["US", "United States"], ["IN", "India"], ["GB", "United Kingdom"],
  ["CA", "Canada"], ["AU", "Australia"], ["DE", "Germany"], ["FR", "France"],
  ["JP", "Japan"], ["KR", "South Korea"], ["BR", "Brazil"], ["MX", "Mexico"],
  ["SG", "Singapore"], ["AE", "United Arab Emirates"],
];

function normalizeRegionOverride(value) {
  const code = String(value || "").trim().toUpperCase();
  return REGION_OPTIONS.some(([option]) => option === code) && code ? code : "";
}

function regionName(code) {
  try { return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code; }
  catch { return code; }
}

const TOUR_STEPS = [
  ["Find something great", "Home combines regional trends, Continue watching, personal picks, and popular anime."],
  ["Sub, Dub and servers", "Anime episodes clearly offer Sub and Dub. If playback is slow, choose another labelled server."],
  ["Keep your place", "Continue watching and My List stay sorted around what you watched most recently."],
  ["Stay securely updated", "Open Space → Settings to check for a verified StreamFree update whenever you want."],
];

function finishTour() {
  writeStorage(TOUR_STORAGE_KEY, { completed: true, at: Date.now() });
  state.tour = { open: false, step: 0 };
  document.querySelector("#tour-root")?.remove();
  document.body.classList.remove("tour-open");
}

function renderTour() {
  const [title, copy] = TOUR_STEPS[state.tour.step] || TOUR_STEPS[0];
  let root = document.querySelector("#tour-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "tour-root";
    document.body.append(root);
  }
  const last = state.tour.step === TOUR_STEPS.length - 1;
  root.innerHTML = `<div class="tour-backdrop"></div><section class="tour-card" role="dialog" aria-modal="true" aria-labelledby="tour-title"><div class="tour-mark">SF</div><span class="eyebrow">A quick tour · ${state.tour.step + 1}/${TOUR_STEPS.length}</span><h2 id="tour-title">${escapeHtml(title)}</h2><p>${escapeHtml(copy)}</p><div class="tour-dots">${TOUR_STEPS.map((_, index) => `<i class="${index === state.tour.step ? "active" : ""}"></i>`).join("")}</div><div class="tour-actions"><button class="glass-button pressable" data-tour-action="skip">Skip tour</button><button class="primary pressable" data-tour-action="next">${last ? "Start watching" : "Next"}</button></div></section>`;
  document.body.classList.add("tour-open");
  requestAnimationFrame(() => root.querySelector("[data-tour-action='next']")?.focus());
}

function maybeShowTour() {
  if (readStorage(TOUR_STORAGE_KEY, null)?.completed) return;
  state.tour = { open: true, step: 0 };
  renderTour();
}

function nativePlatform() {
  return Capacitor.isNativePlatform();
}

function nativeBridge() {
  return Capacitor.Plugins?.StreamFreeNative || window.StreamFreeNative || null;
}

function setPlaybackOrientation(fullscreen) {
  if (fullscreen) {
    nativeBridge()?.lockLandscape?.();
    try {
      void Promise.resolve(screen.orientation?.lock?.("landscape")).catch(() => undefined);
    } catch {
      // Android's native bridge is the reliable fallback in WebView.
    }
  } else {
    nativeBridge()?.lockPortrait?.();
    try {
      screen.orientation?.unlock?.();
    } catch {
      // Orientation APIs are not available in every browser shell.
    }
  }
}

function setPlayerFullscreen(active) {
  if (!state.player) return;
  state.player.fullscreen = active;
  document.documentElement.classList.toggle("player-fullscreen", active);
  setPlaybackOrientation(active);
}

function playerIsFullscreen() {
  return Boolean(state.player?.fullscreen || document.fullscreenElement);
}

async function enterPlayerFullscreen() {
  const target = document.querySelector("#player-frame") || document.querySelector(".player-stage");
  try {
    await target?.requestFullscreen?.({ navigationUI: "hide" });
  } catch {
    // The CSS/native fallback still gives the user a landscape full-bleed player.
  }
  setPlayerFullscreen(true);
}

async function exitPlayerFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
  } catch {
    // Continue restoring the native orientation even if WebView rejects exit.
  }
  setPlayerFullscreen(false);
}

document.addEventListener("fullscreenchange", () => {
  if (!state.player) return;
  setPlayerFullscreen(Boolean(document.fullscreenElement));
});

async function impact(style = ImpactStyle.Light) {
  if (!nativePlatform()) return;
  try {
    await Haptics.impact({ style });
  } catch {
    // Haptics are enhancement-only and can be unavailable on some devices.
  }
}

async function notify(type = NotificationType.Success) {
  if (!nativePlatform()) return;
  try {
    await Haptics.notification({ type });
  } catch {
    // Keep the UI usable when vibration is disabled at the OS level.
  }
}

function absoluteUrl(path) {
  return /^https?:\/\//.test(path) ? path : `${BACKEND_ORIGIN}${path}`;
}

function autoplaySourceUrl(sourceUrl) {
  try {
    const url = new URL(sourceUrl);
    const autoplayKey = [...url.searchParams.keys()].find((key) => key.toLowerCase() === "autoplay");
    url.searchParams.set(autoplayKey || "autoplay", "true");
    const autoPlayKey = [...url.searchParams.keys()].find((key) => key === "autoPlay");
    if (autoPlayKey) url.searchParams.set(autoPlayKey, "true");
    return url.toString();
  } catch {
    return sourceUrl;
  }
}

async function requestJson(path, { method = "GET", body, headers: extraHeaders = {} } = {}) {
  const url = absoluteUrl(path);
  const headers = { ...(body ? { "Content-Type": "application/json" } : {}), ...extraHeaders };

  if (nativePlatform()) {
    const response = await CapacitorHttp.request({
      url,
      method,
      headers,
      data: body,
      responseType: "json",
      connectTimeout: 15_000,
      readTimeout: 25_000,
    });
    if (response.status < 200 || response.status >= 300) {
      const message = response.data?.error || `Request failed (${response.status})`;
      throw new Error(message);
    }
    return typeof response.data === "string" ? JSON.parse(response.data) : response.data;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Request failed (${response.status})`);
  }
  return response.json();
}

async function cached(key, loader, ttl = CACHE_TTL) {
  const found = state.cache.get(key);
  if (found?.data && Date.now() - found.at < ttl) return found.data;
  if (found?.promise) return found.promise;

  const promise = loader()
    .then((data) => {
      state.cache.set(key, { data, at: Date.now() });
      return data;
    })
    .catch((error) => {
      state.cache.delete(key);
      throw error;
    });
  state.cache.set(key, { promise, at: Date.now() });
  return promise;
}

async function getRegion() {
  if (state.region) return state.region;
  const override = normalizeRegionOverride(readStorage(REGION_OVERRIDE_KEY, ""));
  const stored = readStorage(REGION_STORAGE_KEY, null);
  if (!override && stored?.country && Date.now() - Number(stored.at || 0) < 24 * 60 * 60 * 1000) {
    state.region = stored;
    return state.region;
  }
  try {
    const region = await requestJson("/api/geo");
    state.region = override ? { ...region, detectedCountry: region.country, country: override, countryName: regionName(override), source: "override", at: Date.now() } : { ...region, at: Date.now() };
  } catch {
    state.region = override ? { country: override, countryName: regionName(override), source: "override", at: Date.now() } : { country: "US", countryName: "Global", source: "default", at: Date.now() };
  }
  if (!override) writeStorage(REGION_STORAGE_KEY, state.region);
  return state.region;
}

async function checkForUpdate({ silent = false } = {}) {
  state.update = { ...state.update, status: "checking", error: "" };
  try {
    if (nativePlatform() && nativeBridge()?.checkOfficialUpdate) {
      const result = await nativeBridge().checkOfficialUpdate();
      const available = result?.status === "available";
      state.update = { status: available ? "available" : "current", manifest: result, error: "" };
      if (!silent) showToast(available ? `StreamFree ${result.versionName || "update"} is ready.` : "You are on the latest version.");
      if (state.route === "space/settings") renderSettings();
      return state.update;
    }
    const manifest = await requestJson(`${APP_UPDATE_MANIFEST}?t=${Date.now()}`);
    const available = Number(manifest.versionCode || 0) > APP_VERSION_CODE;
    state.update = { status: available ? "available" : "current", manifest, error: "" };
    if (!silent) showToast(available ? `StreamFree ${manifest.versionName || "update"} is ready.` : "You are on the latest version.");
    if (state.route === "space/settings") renderSettings();
    return state.update;
  } catch (error) {
    state.update = { ...state.update, status: "error", error: error.message || "Update check failed" };
    if (!silent) showToast("Could not check for updates.", "error");
    if (state.route === "space/settings") renderSettings();
    return state.update;
  }
}

function installUpdate() {
  if (nativePlatform() && nativeBridge()?.installOfficialUpdate) {
    void nativeBridge().installOfficialUpdate().catch(() => undefined);
    showToast("Verifying and downloading the official StreamFree update…");
    return;
  }
  const apkUrl = state.update.manifest?.apkUrl;
  if (!apkUrl) return showToast("Check for an update first.", "warning");
  const url = absoluteUrl(apkUrl);
  window.open(url, "_blank", "noopener,noreferrer");
  showToast("The update download has started.");
}

function regionalParams(region) {
  return {
    region: region.country,
    watch_region: region.country,
    sort_by: "popularity.desc",
    with_watch_monetization_types: "flatrate|free|ads|rent|buy",
  };
}

function tmdb(endpoint, params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  const path = `/api/tmdb/${endpoint}${query.size ? `?${query}` : ""}`;
  return cached(`tmdb:${path}`, () => requestJson(path));
}

function anilist(query, variables = {}) {
  return requestJson("https://graphql.anilist.co", {
    method: "POST",
    body: { query, variables },
  });
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character]);
}

function stripHtml(value = "") {
  return String(value).replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function titleOf(item) {
  return item.title || item.name || item.original_title || item.original_name || "Untitled";
}

function image(path, backdrop = false) {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  return `${backdrop ? BACKDROP_ORIGIN : IMAGE_ORIGIN}${path}`;
}

function mediaType(item, fallback = "movie") {
  if (item.media_type === "anime" || item.type === "anime") return "anime";
  if (item.media_type === "tv" || item.type === "tv" || item.first_air_date) return "tv";
  return fallback;
}

function mediaId(item) {
  return Number(item.media_id ?? item.id);
}

function normalizeMedia(item, fallback = "movie") {
  const type = mediaType(item, fallback);
  return {
    ...item,
    id: mediaId(item),
    media_type: type,
    type,
    title: titleOf(item),
    name: titleOf(item),
    poster_path: item.poster_path ?? item.poster ?? null,
    backdrop_path: item.backdrop_path ?? item.backdrop ?? null,
    release_date: item.release_date || item.first_air_date || "",
    vote_average: Number(item.vote_average || 0),
    adult: Boolean(item.adult),
  };
}

function rememberMedia(item, fallback = "movie") {
  const media = normalizeMedia(item, fallback);
  const key = `${media.media_type}:${media.id}`;
  state.media.set(key, media);
  return media;
}

function getRemembered(type, id) {
  return state.media.get(`${type}:${Number(id)}`) || { id: Number(id), media_type: type, type };
}

function scoreLabel(item) {
  const score = Number(item.vote_average || 0);
  if (score > 0) return `${score.toFixed(1)} ★`;
  return mediaType(item) === "tv" ? "Series" : mediaType(item) === "anime" ? "Anime" : "Movie";
}

function isSaved(type, id) {
  return currentLibrary().some((item) => mediaType(item, item.type) === type && mediaId(item) === Number(id));
}

function poster(item, fallback = "movie", { rank = 0, progress = null } = {}) {
  const media = rememberMedia(item, fallback);
  const art = image(media.poster_path);
  const saved = isSaved(media.media_type, media.id);
  return `<article class="poster-card reveal-card" style="--reveal-delay:${Math.min(rank, 8) * 42}ms">
    <button class="poster pressable" data-action="detail" data-media="${media.media_type}" data-id="${media.id}" aria-label="Open ${escapeHtml(media.title)}">
      <span class="poster-image shimmer">${art ? `<img src="${escapeHtml(art)}" alt="" loading="lazy" />` : '<i class="poster-fallback"></i>'}${rank ? `<b class="rank">${rank}</b>` : ""}${saved ? '<i class="saved-dot" aria-label="Saved"></i>' : ""}</span>
      ${progress !== null ? `<span class="card-progress"><i style="width:${Math.max(2, Math.min(100, progress))}%"></i></span>` : ""}
      <span class="poster-title">${escapeHtml(media.title)}</span>
      <small>${escapeHtml(scoreLabel(media))}</small>
    </button>
  </article>`;
}

function section(title, items, fallback = "movie", options = {}) {
  if (!items?.length) return "";
  const cards = items.map((item, index) => poster(item, fallback, {
    rank: options.ranked ? index + 1 : 0,
    progress: options.progress ? historyProgress(item) : null,
  })).join("");
  return `<section class="section"><div class="section-head"><div><span>${escapeHtml(options.kicker || "Explore")}</span><h2>${escapeHtml(title)}</h2></div>${options.action ? `<button class="text-action" data-action="${options.action}">${escapeHtml(options.actionLabel || "See all")}</button>` : ""}</div><div class="rail ${options.ranked ? "ranked-rail" : ""}">${cards}</div></section>`;
}

function grid(items, fallback = "movie") {
  return `<div class="grid">${items.map((item, index) => poster(item, fallback, { rank: 0, progress: null, index })).join("")}</div>`;
}

function showToast(message, tone = "default") {
  toast.textContent = message;
  toast.dataset.tone = tone;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 3200);
}

function setBusy(button, busy, label = "Please wait") {
  if (!button) return;
  button.disabled = busy;
  if (busy) {
    button.dataset.previousLabel = button.innerHTML;
    button.innerHTML = `<span class="button-spinner"></span>${escapeHtml(label)}`;
  } else if (button.dataset.previousLabel) {
    button.innerHTML = button.dataset.previousLabel;
    delete button.dataset.previousLabel;
  }
}

function guestLibrary() {
  return readStorage(LOCAL_LIBRARY_KEY, []);
}

function guestHistory() {
  return readStorage(LOCAL_HISTORY_KEY, []);
}

function currentLibrary() {
  if (!state.user) return guestLibrary();
  return [...state.watchlist, ...guestLibrary().filter((item) => mediaType(item, item.type) === "anime")];
}

function currentHistory() {
  if (!state.user) return guestHistory();
  return [...state.histories, ...guestHistory().filter((item) => mediaType(item, item.type) === "anime")]
    .sort((a, b) => new Date(b.updated_at || b.watchedAt || 0) - new Date(a.updated_at || a.watchedAt || 0));
}

function latestHistoryTitles(items) {
  return [...items]
    .sort((a, b) => new Date(b.updated_at || b.watchedAt || 0) - new Date(a.updated_at || a.watchedAt || 0))
    .filter((item, index, rows) => rows.findIndex((candidate) => mediaType(candidate, candidate.type) === mediaType(item, item.type) && mediaId(candidate) === mediaId(item)) === index);
}

function historyProgress(item) {
  const duration = Number(item.duration || 0);
  const position = Number(item.last_position || 0);
  if (!duration) return item.completed ? 100 : 8;
  return Math.round((position / duration) * 100);
}

function historyDate(item) {
  const value = item.updated_at || item.watchedAt || item.created_at;
  if (!value) return "Recently watched";
  const date = new Date(value);
  return `Watched ${new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date)}`;
}

function accountInitials() {
  const label = state.profile?.username || state.user?.email || "SF";
  return label.split(/[@\s._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SF";
}

function updateAccountChrome() {
  accountButton.querySelector("span").textContent = accountInitials();
  accountButton.classList.toggle("signed-in", Boolean(state.user));
  accountButton.querySelector("i").title = state.user ? "Signed in" : "Guest";
}

function authMessage(error, fallback = "Something went wrong. Please try again.") {
  const text = String(error?.message || error || "").toLowerCase();
  if (text.includes("invalid login")) return "That email and password do not match an account.";
  if (text.includes("email not confirmed")) return "Confirm your email first, then sign in.";
  if (text.includes("already registered") || text.includes("already exists")) return "An account with that email already exists.";
  if (text.includes("password")) return "Check your password and try again.";
  if (text.includes("rate") || text.includes("too many")) return "Too many attempts. Wait a moment and try again.";
  if (text.includes("network") || text.includes("fetch")) return "Could not reach account services. Check your connection.";
  return fallback;
}

async function initializeAuth() {
  try {
    const config = await requestJson("/api/mobile/config");
    state.supabase = createClient(config.supabaseUrl, config.supabasePublishableKey, {
      auth: {
        storage: window.localStorage,
        storageKey: AUTH_STORAGE_KEY,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });

    const { data, error } = await state.supabase.auth.getSession();
    if (error) throw error;
    state.user = data.session?.user || null;
    state.authReady = true;
    updateAccountChrome();
    if (state.user) await loadAccountData({ mergeGuest: true });

    state.supabase.auth.onAuthStateChange((event, session) => {
      state.user = session?.user || null;
      updateAccountChrome();
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        window.setTimeout(() => loadAccountData({ mergeGuest: event === "SIGNED_IN" }), 0);
      }
      if (event === "SIGNED_OUT") {
        state.profile = null;
        state.watchlist = [];
        state.histories = [];
        if (state.route.startsWith("space")) render();
      }
    });
  } catch (error) {
    console.error("[mobile-auth] initialization failed", error);
    state.authReady = true;
    state.authError = "Account sync is temporarily unavailable. Guest mode still works.";
  }
  updateAccountChrome();
  if (state.route.startsWith("space") || state.route === "home") render();
}

async function ensureProfile() {
  if (!state.supabase || !state.user) return null;
  const { data } = await state.supabase.from("profiles").select("username").eq("id", state.user.id).maybeSingle();
  if (data) return data;

  const metadataName = String(state.user.user_metadata?.username || "").trim();
  if (!metadataName) return null;
  const { data: created } = await state.supabase
    .from("profiles")
    .upsert({ id: state.user.id, username: metadataName }, { onConflict: "id" })
    .select("username")
    .maybeSingle();
  return created || null;
}

function watchlistPayload(item) {
  const media = normalizeMedia(item, item.type);
  return {
    user_id: state.user.id,
    id: media.id,
    type: media.media_type,
    adult: media.adult,
    backdrop_path: media.backdrop_path || null,
    poster_path: media.poster_path || null,
    release_date: media.release_date || "1970-01-01",
    title: media.title,
    vote_average: Number(media.vote_average || 0).toFixed(1),
  };
}

function historyPayload(item) {
  const media = normalizeMedia(item, item.type);
  return {
    user_id: state.user.id,
    media_id: media.id,
    type: media.media_type,
    season: Number(item.season || 0),
    episode: Number(item.episode || 0),
    duration: Number(item.duration || 0),
    last_position: Number(item.last_position || 0),
    total_watched_seconds: Number(item.total_watched_seconds || 0),
    completed: Boolean(item.completed),
    adult: media.adult,
    backdrop_path: media.backdrop_path || null,
    poster_path: media.poster_path || null,
    release_date: media.release_date || "1970-01-01",
    title: media.title,
    vote_average: Number(media.vote_average || 0).toFixed(1),
  };
}

async function mergeGuestData() {
  if (!state.supabase || !state.user) return;
  const localLibrary = guestLibrary();
  const localHistory = guestHistory();

  if (localLibrary.length) {
    const existing = new Set(state.watchlist.map((item) => `${item.type}:${item.id}`));
    const additions = localLibrary
      .filter((item) => mediaType(item, item.type) !== "anime")
      .filter((item) => !existing.has(`${mediaType(item, item.type)}:${mediaId(item)}`))
      .map(watchlistPayload);
    if (additions.length) await state.supabase.from("watchlist").insert(additions);
  }

  if (localHistory.length) {
    const additions = localHistory
      .filter((item) => mediaType(item, item.type) !== "anime")
      .map(historyPayload);
    if (additions.length) {
      await state.supabase.from("histories").upsert(additions, {
        onConflict: "user_id,media_id,type,season,episode",
        ignoreDuplicates: true,
      });
    }
  }

  if (localLibrary.length || localHistory.length) {
    writeStorage(LOCAL_LIBRARY_KEY, localLibrary.filter((item) => mediaType(item, item.type) === "anime"));
    writeStorage(LOCAL_HISTORY_KEY, localHistory.filter((item) => mediaType(item, item.type) === "anime"));
  }
}

async function loadAccountData({ mergeGuest = false } = {}) {
  if (!state.supabase || !state.user || state.syncBusy) return;
  state.syncBusy = true;
  try {
    const [profileResult, watchlistResult, historiesResult] = await Promise.all([
      ensureProfile(),
      state.supabase.from("watchlist").select("*").order("created_at", { ascending: false }),
      state.supabase.from("histories").select("*").order("updated_at", { ascending: false }).limit(100),
    ]);
    state.profile = profileResult;
    if (watchlistResult.error) throw watchlistResult.error;
    if (historiesResult.error) throw historiesResult.error;
    state.watchlist = watchlistResult.data || [];
    state.histories = historiesResult.data || [];

    if (mergeGuest) {
      await mergeGuestData();
      const [watchlistRefresh, historyRefresh] = await Promise.all([
        state.supabase.from("watchlist").select("*").order("created_at", { ascending: false }),
        state.supabase.from("histories").select("*").order("updated_at", { ascending: false }).limit(100),
      ]);
      if (!watchlistRefresh.error) state.watchlist = watchlistRefresh.data || [];
      if (!historyRefresh.error) state.histories = historyRefresh.data || [];
    }
    updateAccountChrome();
    if (state.route === "home" || state.route.startsWith("space")) render();
  } catch (error) {
    console.error("[mobile-sync] refresh failed", error);
    showToast("Your account is connected, but sync needs another try.", "warning");
  } finally {
    state.syncBusy = false;
  }
}

async function toggleLibrary(item) {
  const media = normalizeMedia(item, item.type);
  const saved = isSaved(media.media_type, media.id);

  if (!state.user || !state.supabase || media.media_type === "anime") {
    const items = guestLibrary().filter((entry) => !(mediaId(entry) === media.id && mediaType(entry, entry.type) === media.media_type));
    if (!saved) items.unshift(media);
    writeStorage(LOCAL_LIBRARY_KEY, items.slice(0, 150));
    showToast(saved ? "Removed from your library" : media.media_type === "anime" && state.user ? "Anime saved on this device" : "Saved to your library");
    await impact();
    render();
    return;
  }

  try {
    if (saved) {
      const { error } = await state.supabase.from("watchlist").delete().eq("user_id", state.user.id).eq("id", media.id).eq("type", media.media_type);
      if (error) throw error;
      state.watchlist = state.watchlist.filter((entry) => !(entry.id === media.id && entry.type === media.media_type));
    } else {
      const payload = watchlistPayload(media);
      const { data, error } = await state.supabase.from("watchlist").insert(payload).select().single();
      if (error && error.code !== "23505") throw error;
      if (data) state.watchlist.unshift(data);
    }
    showToast(saved ? "Removed everywhere" : "Saved to your synced library");
    await notify(NotificationType.Success);
    render();
  } catch (error) {
    console.error("[mobile-sync] library mutation failed", error);
    showToast("Could not update your library. Try again.", "error");
    await notify(NotificationType.Error);
  }
}

async function recordHistory(item) {
  const media = normalizeMedia(item, item.type);
  const record = { ...media, season: Number(item.season || 0), episode: Number(item.episode || 0), watchedAt: Date.now() };

  if (!state.user || !state.supabase || media.media_type === "anime") {
    const items = guestHistory().filter((entry) => !(mediaId(entry) === media.id && mediaType(entry, entry.type) === media.media_type && Number(entry.season || 0) === record.season && Number(entry.episode || 0) === record.episode));
    items.unshift(record);
    writeStorage(LOCAL_HISTORY_KEY, items.slice(0, 80));
    return;
  }

  const payload = historyPayload(record);
  const { data, error } = await state.supabase.from("histories").upsert(payload, {
    onConflict: "user_id,media_id,type,season,episode",
  }).select().single();
  if (error) {
    console.error("[mobile-sync] history mutation failed", error);
    return;
  }
  state.histories = [data, ...state.histories.filter((entry) => !(entry.media_id === data.media_id && entry.type === data.type && entry.season === data.season && entry.episode === data.episode))];
}

function routeFromHash() {
  return window.location.hash.replace(/^#\/?/, "").split("?")[0] || "home";
}

function rootRoute(route) {
  const first = route.split("/")[0];
  if (["detail", "player"].includes(first)) return state.previousRoot === "anime" ? "anime" : "browse";
  if (first === "auth") return "space";
  return TAB_ORDER.includes(first) ? first : "home";
}

function setRoute(route, { replace = false } = {}) {
  const next = `#/${route}`;
  if (replace) window.location.replace(next);
  else window.location.hash = next;
}

function activateTab(route) {
  const root = rootRoute(route);
  document.querySelectorAll("[data-tab]").forEach((element) => {
    const active = element.dataset.tab === root;
    element.classList.toggle("active", active);
    if (active) element.setAttribute("aria-current", "page");
    else element.removeAttribute("aria-current");
  });
}

function commit(html, { root = rootRoute(state.route), preserveScroll = false } = {}) {
  const previousIndex = TAB_ORDER.indexOf(state.previousRoot);
  const nextIndex = TAB_ORDER.indexOf(root);
  const direction = nextIndex >= previousIndex ? "forward" : "backward";
  const swap = () => {
    view.innerHTML = html;
    view.classList.remove("screen-forward", "screen-backward");
    void view.offsetWidth;
    if (!state.settings.reduceMotion) view.classList.add(direction === "forward" ? "screen-forward" : "screen-backward");
  };

  if (!state.settings.reduceMotion && document.startViewTransition) document.startViewTransition(swap);
  else swap();

  if (!preserveScroll) window.scrollTo({ top: 0, behavior: "instant" });
  state.previousRoot = root;
}

function renderLoading(label = "Finding something great") {
  commit(`<section class="loading-screen" aria-label="${escapeHtml(label)}"><div class="loading-orbit"><i></i><i></i><i></i></div><p>${escapeHtml(label)}</p><span>StreamFree</span></section>`);
}

function renderError(title, copy, retry = true) {
  commit(`<section class="empty-state"><div class="empty-icon">!</div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(copy)}</p>${retry ? '<button class="primary pressable" data-action="retry">Try again</button>' : ""}</section>`);
}

function heroMarkup(hero, resume = false) {
  const media = rememberMedia(hero, mediaType(hero));
  const art = image(media.backdrop_path, true) || image(media.poster_path, true);
  const year = (media.release_date || media.first_air_date || "").slice(0, 4);
  const progress = resume ? historyProgress(hero) : null;
  return `<section class="hero">
    ${art ? `<img class="hero-art" src="${escapeHtml(art)}" alt="" />` : ""}
    <div class="hero-vignette"></div>
    <div class="hero-copy">
      <span class="eyebrow">${resume ? "Continue watching" : "Tonight's premiere"}</span>
      <h1>${escapeHtml(media.title)}</h1>
      <div class="hero-meta"><span>${media.media_type === "tv" ? "Series" : media.media_type === "anime" ? "Anime" : "Movie"}</span>${year ? `<i></i><span>${year}</span>` : ""}${media.vote_average ? `<i></i><span>${Number(media.vote_average).toFixed(1)} ★</span>` : ""}</div>
      <p>${escapeHtml(media.overview || (resume ? "Pick up instantly from your recent watch." : "Your next great story is one tap away."))}</p>
      ${progress !== null ? `<div class="hero-progress"><span style="width:${Math.max(3, progress)}%"></span></div>` : ""}
      <div class="hero-actions"><button class="primary pressable" data-action="play" data-media="${media.media_type}" data-id="${media.id}" data-title="${escapeHtml(media.title)}">${resume ? "▶ Resume" : "▶ Watch now"}</button><button class="glass-button pressable" data-action="save" data-media="${media.media_type}" data-id="${media.id}">${isSaved(media.media_type, media.id) ? "✓ Saved" : "+ My List"}</button></div>
    </div>
  </section>`;
}

async function loadSharedHomeFeed() {
  const override = normalizeRegionOverride(readStorage(REGION_OVERRIDE_KEY, ""));
  let accessToken;
  if (state.supabase) {
    const { data } = await state.supabase.auth.getSession();
    accessToken = data.session?.access_token;
  }
  return fetchSharedHomeFeed(requestJson, { accessToken, regionOverride: override || undefined });
}

function renderSharedHomeFeed(feed) {
  const mapped = toNativeHomeFeed(feed);
  const history = mapped.history.filter((item) => !item.completed);
  const hero = mapped.hero || history[0] || mapped.trending[0] || mapped.regionalMovies[0] || mapped.anime[0];
  if (!hero) throw new Error("Shared home feed is empty");
  const countryLabel = feed.region.source === "default" && feed.region.effectiveCountry === "US" ? "Global" : feed.region.countryName;
  const displayName = state.user ? state.profile?.username || state.user.email?.split("@")[0] : "Guest";
  const markup = [
    heroMarkup(hero, mapped.heroIsResume),
    '<section class="welcome-strip"><div><span>' + (state.user ? "Synced across devices" : "Private guest session") + '</span><strong>' + escapeHtml(displayName) + '</strong></div><button class="avatar-chip pressable" data-route="space">' + escapeHtml(accountInitials()) + '</button></section>',
    section("Continue watching", history.slice(1), "movie", { kicker: "Most recently watched", progress: true, action: "open-history", actionLabel: "History" }),
    mapped.personalized.length ? section("Picked for you", mapped.personalized, "movie", { kicker: "Based on your watches" }) : "",
    section(countryLabel + " trending movies", mapped.regionalMovies, "movie", { kicker: "What people are watching nearby", ranked: true }),
    section(countryLabel + " trending series", mapped.regionalSeries, "tv", { kicker: "Series popular in your region" }),
    section("Trending anime", mapped.anime, "anime", { kicker: "Fresh picks from AniList" }),
    section("Trending now", mapped.trending, "movie", { kicker: "Everyone is watching", ranked: true }),
    '<section class="home-end"><span>SF</span><p>You reached the credits.</p><button class="text-action" data-action="scroll-top">Back to top</button></section>',
  ].join("");
  commit(markup, { root: "home" });
}

async function renderHome() {
  if (!navigator.onLine) {
    renderOfflineHome();
    return;
  }
  renderLoading(state.user ? `Welcome back, ${state.profile?.username || "movie lover"}` : "Building your home");
  try {
    try {
      const sharedFeed = await loadSharedHomeFeed();
      renderSharedHomeFeed(sharedFeed);
      return;
    } catch (sharedError) {
      console.warn("[mobile-home] shared feed unavailable; using legacy fallback", sharedError);
    }
    const region = await getRegion();
    const localParams = regionalParams(region);
    const [trending, movies, shows, regionalMovies, regionalSeries, animeData] = await Promise.all([
      tmdb("trending/all/day", { region: region.country }),
      tmdb("movie/popular", localParams),
      tmdb("tv/popular", localParams),
      tmdb("discover/movie", localParams),
      tmdb("discover/tv", localParams),
      anilist("query { Page(page: 1, perPage: 14) { media(sort: TRENDING_DESC, type: ANIME, isAdult: false) { id title { romaji english } coverImage { large extraLarge } bannerImage averageScore episodes format status genres description } } }"),
    ]);
    const history = latestHistoryTitles(currentHistory().filter((item) => !item.completed));
    const hero = history[0] ? normalizeMedia(history[0], history[0].type) : trending.results[0];
    let picked = regionalMovies.results?.length ? regionalMovies.results : movies.results;
    const seed = history[0] || currentLibrary()[0];
    if (seed && ["movie", "tv"].includes(mediaType(seed, seed.type))) {
      try {
        const recommendations = await tmdb(`${mediaType(seed, seed.type)}/${mediaId(seed)}/recommendations`, { region: region.country });
        if (recommendations.results?.length) picked = recommendations.results;
      } catch {
        // The curated top-rated row is the resilient fallback.
      }
    }

    const displayName = state.user ? state.profile?.username || state.user.email?.split("@")[0] : "Guest";
    const anime = animeData?.data?.Page?.media?.map(fromAnime) || [];
    const countryLabel = region.source === "default" ? "Global" : region.countryName;
    commit(`${heroMarkup(hero, Boolean(history[0]))}
      <section class="welcome-strip"><div><span>${state.user ? "Synced across devices" : "Private guest session"}</span><strong>${escapeHtml(displayName)}</strong></div><button class="avatar-chip pressable" data-route="space">${escapeHtml(accountInitials())}</button></section>
      ${section("Continue watching", history.slice(1), "movie", { kicker: "Most recently watched", progress: true, action: "open-history", actionLabel: "History" })}
      ${section(state.user ? "Picked for you" : "Trending now", picked.slice(0, 12), "movie", { kicker: state.user ? "Based on your watches" : `Popular in ${countryLabel}` })}
      ${section(`${countryLabel} trending movies`, regionalMovies.results?.slice(0, 14), "movie", { kicker: "What people are watching nearby", ranked: true })}
      ${section(`${countryLabel} trending series`, regionalSeries.results?.slice(0, 14), "tv", { kicker: "Series popular in your region" })}
      ${section("Trending anime", anime.slice(0, 14), "anime", { kicker: "Fresh picks from AniList" })}
      ${vibeMarkup([movies.results[2], movies.results[5], regionalMovies.results?.[2], regionalSeries.results?.[3]])}
      ${section("Popular on StreamFree", movies.results.slice(0, 12), "movie", { kicker: "Big screen energy" })}
      ${section("Binge-worthy series", shows.results.slice(0, 12), "tv", { kicker: "One more episode" })}
      <section class="home-end"><span>SF</span><p>You reached the credits.</p><button class="text-action" data-action="scroll-top">Back to top</button></section>`, { root: "home" });
  } catch (error) {
    console.error(error);
    renderError("Home could not load", "Check your connection and try again.");
  }
}

function renderOfflineHome() {
  const histories = latestHistoryTitles(currentHistory().filter((item) => !item.completed));
  const library = currentLibrary();
  const hero = histories[0] || library[0];
  const lead = hero
    ? heroMarkup(hero, Boolean(histories[0]))
    : '<section class="offline-home"><div class="offline-symbol">⌁</div><span class="eyebrow">Offline mode</span><h1>Your app is ready when the internet returns.</h1><p>Saved titles remain visible, while posters, details and streams reconnect automatically.</p></section>';
  commit(`${lead}${section("Continue watching", histories.slice(0, 12), "movie", { kicker: "Saved on this device", progress: true })}${section("Your library", library.slice(0, 16), "movie", { kicker: state.user ? "Last synced" : "Guest library" })}`, { root: "home" });
}

function vibeMarkup(items) {
  const vibes = [
    [28, "Adrenaline", "Action"],
    [35, "Feel good", "Comedy"],
    [27, "After dark", "Horror"],
    [878, "Other worlds", "Sci-fi"],
  ];
  return `<section class="section"><div class="section-head"><div><span>Choose your mood</span><h2>What is the vibe?</h2></div></div><div class="vibe-grid">${vibes.map(([id, title, label], index) => {
    const art = image(items[index]?.backdrop_path || items[index]?.poster_path, true);
    return `<button class="vibe-card pressable" data-action="browse-genre" data-genre="${id}" data-type="movie">${art ? `<img src="${escapeHtml(art)}" alt="" />` : ""}<i></i><span>${escapeHtml(label)}</span><strong>${escapeHtml(title)}</strong></button>`;
  }).join("")}</div></section>`;
}

function recentSearches() {
  return readStorage(RECENT_SEARCH_KEY, []);
}

function rememberSearch(query) {
  const items = [query, ...recentSearches().filter((item) => item.toLowerCase() !== query.toLowerCase())].slice(0, 6);
  writeStorage(RECENT_SEARCH_KEY, items);
}

async function renderSearch() {
  const recent = recentSearches();
  let trending = [];
  try {
    trending = (await tmdb("trending/all/day")).results.slice(0, 8);
  } catch {
    // Search remains available even if suggestions fail.
  }
  commit(`<section class="page-head"><span class="eyebrow">Find your next watch</span><h1>Search</h1><p>Movies, series, anime and people—without leaving the app.</p></section>
    <form class="search-shell" id="search-form"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.2"></circle><path d="m15.2 15.2 4.2 4.2"></path></svg><input id="search-input" name="query" autocomplete="off" inputmode="search" placeholder="What do you want to watch?" /><button class="pressable" aria-label="Search">Go</button></form>
    ${recent.length ? `<section class="recent-searches"><div class="section-head"><div><span>Your searches</span><h2>Recent</h2></div><button class="text-action" data-action="clear-searches">Clear</button></div><div class="chips">${recent.map((query) => `<button class="chip pressable" data-action="search-query" data-query="${escapeHtml(query)}">${escapeHtml(query)}</button>`).join("")}</div></section>` : ""}
    <div id="search-results">${section("Trending searches", trending, "movie", { kicker: "Try something popular" })}</div>`, { root: "search" });
  window.setTimeout(() => document.querySelector("#search-input")?.focus(), 220);
}

async function performSearch(query) {
  const results = document.querySelector("#search-results");
  if (!results) return;
  results.innerHTML = '<div class="inline-loading"><span></span>Searching StreamFree</div>';
  rememberSearch(query);
  try {
    const [titles, animeData] = await Promise.all([
      tmdb("search/multi", { query }),
      anilist("query ($search: String) { Page(page: 1, perPage: 8) { media(search: $search, type: ANIME, sort: SEARCH_MATCH) { id title { romaji english } coverImage { large } averageScore episodes format description } } }", { search: query }),
    ]);
    const media = titles.results.filter((item) => ["movie", "tv"].includes(item.media_type));
    const anime = animeData.data.Page.media.map(fromAnime);
    results.innerHTML = `${media.length ? `<section class="section search-section"><div class="section-head"><div><span>Movies and series</span><h2>${media.length} matches</h2></div></div>${grid(media)}</section>` : ""}${anime.length ? section("Anime matches", anime, "anime", { kicker: "From AniList" }) : ""}${!media.length && !anime.length ? '<section class="empty-state compact"><h2>No matches found</h2><p>Try a shorter title or another spelling.</p></section>' : ""}`;
  } catch (error) {
    console.error(error);
    results.innerHTML = '<section class="empty-state compact"><h2>Search is offline</h2><p>Reconnect and try that search again.</p></section>';
  }
}

const BROWSE_FILTERS = {
  popular: { label: "Popular", movie: "movie/popular", tv: "tv/popular" },
  trending: { label: "Trending", movie: "trending/movie/week", tv: "trending/tv/week" },
  top: { label: "Top rated", movie: "movie/top_rated", tv: "tv/top_rated" },
  fresh: { label: "New releases", movie: "movie/now_playing", tv: "tv/on_the_air" },
};

async function renderBrowse() {
  renderLoading("Opening the catalogue");
  try {
    const endpoint = state.browseGenre ? `discover/${state.browseType}` : BROWSE_FILTERS[state.browseFilter][state.browseType];
    const [data, genreData] = await Promise.all([
      tmdb(endpoint, { page: state.browsePage, with_genres: state.browseGenre, sort_by: state.browseGenre ? "popularity.desc" : "" }),
      tmdb(`genre/${state.browseType}/list`),
    ]);
    const selectedGenre = genreData.genres.find((genre) => String(genre.id) === String(state.browseGenre));
    commit(`<section class="page-head"><span class="eyebrow">Explore the catalogue</span><h1>Browse</h1><p>${selectedGenre ? `${selectedGenre.name} picks` : "A better way to find tonight's movie or series."}</p></section>
      <div class="segment-control" role="tablist"><button class="pressable ${state.browseType === "movie" ? "active" : ""}" data-action="browse-type" data-type="movie">Movies</button><button class="pressable ${state.browseType === "tv" ? "active" : ""}" data-action="browse-type" data-type="tv">Series</button><i></i></div>
      <div class="filter-scroll">${Object.entries(BROWSE_FILTERS).map(([key, filter]) => `<button class="filter-pill pressable ${!state.browseGenre && state.browseFilter === key ? "active" : ""}" data-action="browse-filter" data-filter="${key}">${filter.label}</button>`).join("")}</div>
      <section class="genre-panel"><span>Genres</span><div class="chips"><button class="chip pressable ${!state.browseGenre ? "active" : ""}" data-action="browse-genre" data-genre="" data-type="${state.browseType}">All</button>${genreData.genres.slice(0, 14).map((genre) => `<button class="chip pressable ${String(state.browseGenre) === String(genre.id) ? "active" : ""}" data-action="browse-genre" data-genre="${genre.id}" data-type="${state.browseType}">${escapeHtml(genre.name)}</button>`).join("")}</div></section>
      <section class="catalogue"><div class="section-head"><div><span>${selectedGenre?.name || BROWSE_FILTERS[state.browseFilter].label}</span><h2>${state.browseType === "movie" ? "Movies" : "Series"} to watch</h2></div></div>${grid(data.results, state.browseType)}</section>
      ${data.page < data.total_pages ? '<button class="load-more pressable" data-action="browse-more">Load another page</button>' : ""}`, { root: "browse" });
  } catch (error) {
    console.error(error);
    renderError("The catalogue is unavailable", "Reconnect and try browsing again.");
  }
}

function fromAnime(item) {
  return normalizeMedia({
    id: item.id,
    title: item.title?.english || item.title?.romaji || item.title,
    poster_path: item.coverImage?.extraLarge || item.coverImage?.large || item.poster_path,
    backdrop_path: item.bannerImage || item.coverImage?.extraLarge,
    vote_average: item.averageScore ? item.averageScore / 10 : item.vote_average,
    overview: stripHtml(item.description || item.overview),
    media_type: "anime",
    type: "anime",
    episodes: item.episodes,
    format: item.format,
    status: item.status,
    genres: item.genres,
  }, "anime");
}

async function renderAnime() {
  renderLoading("Opening the anime room");
  try {
    const response = await anilist("query ($sort: [MediaSort]) { Page(page: 1, perPage: 30) { media(sort: $sort, type: ANIME, isAdult: false) { id title { romaji english } coverImage { large extraLarge } bannerImage averageScore episodes format status genres description } } }", { sort: [state.animeSort] });
    const anime = response.data.Page.media.map(fromAnime);
    const filters = [["TRENDING_DESC", "Trending"], ["POPULARITY_DESC", "Popular"], ["SCORE_DESC", "Top rated"], ["UPDATED_AT_DESC", "Fresh episodes"]];
    commit(`<section class="anime-hero"><div class="anime-orb"></div><span class="eyebrow">A world beyond</span><h1>Anime</h1><p>New episodes, modern favorites and legendary stories.</p></section>
      <div class="filter-scroll anime-filters">${filters.map(([value, label]) => `<button class="filter-pill pressable ${state.animeSort === value ? "active" : ""}" data-action="anime-sort" data-sort="${value}">${label}</button>`).join("")}</div>
      <section class="catalogue anime-catalogue"><div class="section-head"><div><span>Curated by AniList</span><h2>${filters.find(([value]) => value === state.animeSort)?.[1]}</h2></div></div>${grid(anime, "anime")}</section>`, { root: "anime" });
  } catch (error) {
    console.error(error);
    renderError("Anime could not load", "Check your internet connection and try again.");
  }
}

async function renderDetail(mediaTypeValue, id) {
  renderLoading("Opening title details");
  if (mediaTypeValue === "anime") return renderAnimeDetail(id);

  try {
    const [details, similar] = await Promise.all([
      tmdb(`${mediaTypeValue}/${id}`, { append_to_response: "videos,credits" }),
      tmdb(`${mediaTypeValue}/${id}/similar`),
    ]);
    const media = rememberMedia({ ...details, media_type: mediaTypeValue }, mediaTypeValue);
    const art = image(details.backdrop_path, true) || image(details.poster_path, true);
    const year = (details.release_date || details.first_air_date || "").slice(0, 4);
    const runtime = details.runtime || details.episode_run_time?.[0];
    const cast = details.credits?.cast?.slice(0, 10) || [];
    const trailer = details.videos?.results?.find((video) => video.site === "YouTube" && video.type === "Trailer");
    let episodeMarkup = "";
    if (mediaTypeValue === "tv" && details.seasons?.length) {
      const validSeasons = details.seasons.filter((season) => season.season_number > 0 && season.episode_count > 0);
      if (!validSeasons.some((season) => season.season_number === state.detailSeason)) state.detailSeason = validSeasons[0]?.season_number || 1;
      const seasonData = await tmdb(`tv/${id}/season/${state.detailSeason}`);
      episodeMarkup = `<section class="episode-section"><div class="section-head"><div><span>${details.number_of_seasons || validSeasons.length} seasons</span><h2>Episodes</h2></div></div><div class="season-tabs">${validSeasons.map((season) => `<button class="chip pressable ${season.season_number === state.detailSeason ? "active" : ""}" data-action="season" data-season="${season.season_number}" data-media="tv" data-id="${id}">S${season.season_number}</button>`).join("")}</div><div class="episode-list">${seasonData.episodes.map((episode) => episodeCard(media, episode, state.detailSeason)).join("")}</div></section>`;
    }

    commit(`<article class="detail-page">
      <section class="detail-visual">${art ? `<img src="${escapeHtml(art)}" alt="" />` : ""}<div></div><button class="back-fab pressable" data-action="back" aria-label="Go back">‹</button>${trailer ? `<button class="trailer-pill pressable" data-action="trailer" data-key="${escapeHtml(trailer.key)}">Trailer</button>` : ""}</section>
      <section class="detail-content"><span class="eyebrow">${mediaTypeValue === "tv" ? "StreamFree series" : "StreamFree movie"}</span><h1>${escapeHtml(media.title)}</h1><div class="detail-meta">${year ? `<span>${year}</span>` : ""}<span>${Number(details.vote_average || 0).toFixed(1)} ★</span>${runtime ? `<span>${runtime} min</span>` : ""}${details.status ? `<span>${escapeHtml(details.status)}</span>` : ""}</div><div class="genre-line">${(details.genres || []).slice(0, 4).map((genre) => `<span>${escapeHtml(genre.name)}</span>`).join("")}</div><p>${escapeHtml(details.overview || "Details are being updated for this title.")}</p><div class="hero-actions sticky-actions"><button class="primary pressable" data-action="play" data-media="${mediaTypeValue}" data-id="${id}" data-title="${escapeHtml(media.title)}" data-season="${mediaTypeValue === "tv" ? state.detailSeason : 0}" data-episode="${mediaTypeValue === "tv" ? 1 : 0}">▶ ${mediaTypeValue === "tv" ? "Start episode" : "Watch now"}</button><button class="glass-button pressable" data-action="save" data-media="${mediaTypeValue}" data-id="${id}">${isSaved(mediaTypeValue, id) ? "✓ Saved" : "+ My List"}</button></div></section>
      ${cast.length ? `<section class="cast-section"><div class="section-head"><div><span>On screen</span><h2>Cast</h2></div></div><div class="cast-rail">${cast.map((person) => `<article>${person.profile_path ? `<img src="${image(person.profile_path)}" alt="" loading="lazy" />` : '<div class="cast-placeholder"></div>'}<strong>${escapeHtml(person.name)}</strong><span>${escapeHtml(person.character || "Cast")}</span></article>`).join("")}</div></section>` : ""}
      ${episodeMarkup}
      ${section("More like this", similar.results?.slice(0, 12), mediaTypeValue, { kicker: "Keep exploring" })}</article>`, { root: state.previousRoot });
  } catch (error) {
    console.error(error);
    renderError("Details could not load", "This title is temporarily unavailable.");
  }
}

function episodeCard(show, episode, season) {
  const still = image(episode.still_path, true);
  return `<button class="episode-card pressable" data-action="play" data-media="tv" data-id="${show.id}" data-title="${escapeHtml(show.title)}" data-season="${season}" data-episode="${episode.episode_number}">${still ? `<img src="${escapeHtml(still)}" alt="" loading="lazy" />` : '<span class="episode-fallback">SF</span>'}<span><small>S${season} · E${episode.episode_number}</small><strong>${escapeHtml(episode.name || `Episode ${episode.episode_number}`)}</strong><i>${episode.runtime ? `${episode.runtime} min` : "Play episode"}</i></span><b>▶</b></button>`;
}

async function renderAnimeDetail(id) {
  try {
    const response = await anilist("query ($id: Int) { Media(id: $id, type: ANIME) { id title { romaji english } coverImage { large extraLarge } bannerImage averageScore episodes format status genres description studios(isMain: true) { nodes { name } } } }", { id: Number(id) });
    const anime = rememberMedia(fromAnime(response.data.Media), "anime");
    const art = image(anime.backdrop_path, true) || image(anime.poster_path, true);
    const count = Math.min(Number(anime.episodes || 12), 48);
    commit(`<article class="detail-page anime-detail"><section class="detail-visual">${art ? `<img src="${escapeHtml(art)}" alt="" />` : ""}<div></div><button class="back-fab pressable" data-action="back">‹</button></section><section class="detail-content"><span class="eyebrow">StreamFree anime</span><h1>${escapeHtml(anime.title)}</h1><div class="detail-meta"><span>${escapeHtml(anime.format || "Anime")}</span><span>${anime.vote_average.toFixed(1)} ★</span><span>${escapeHtml(anime.status || "Ongoing")}</span></div><div class="genre-line">${(anime.genres || []).slice(0, 4).map((genre) => `<span>${escapeHtml(genre)}</span>`).join("")}</div><p>${escapeHtml(anime.overview || "A new story is ready to begin.")}</p><div class="hero-actions sticky-actions"><button class="primary pressable" data-action="play" data-media="anime" data-id="${id}" data-title="${escapeHtml(anime.title)}" data-episode="1" data-audio="sub">▶ Episode 1 · Sub</button><button class="glass-button pressable" data-action="play" data-media="anime" data-id="${id}" data-title="${escapeHtml(anime.title)}" data-episode="1" data-audio="dub">Episode 1 · Dub</button><button class="glass-button pressable" data-action="save" data-media="anime" data-id="${id}">${isSaved("anime", id) ? "✓ Saved" : "+ My List"}</button></div></section><section class="episode-section"><div class="section-head"><div><span>${anime.episodes || "Ongoing"} episodes</span><h2>Episode guide</h2></div></div><div class="anime-episodes">${Array.from({ length: count }, (_, index) => `<article class="episode-chip"><span>${index + 1}</span><div><button class="pressable" data-action="play" data-media="anime" data-id="${id}" data-title="${escapeHtml(anime.title)}" data-episode="${index + 1}" data-audio="sub">Sub</button><button class="pressable" data-action="play" data-media="anime" data-id="${id}" data-title="${escapeHtml(anime.title)}" data-episode="${index + 1}" data-audio="dub">Dub</button></div></article>`).join("")}</div></section></article>`, { root: "anime" });
  } catch (error) {
    console.error(error);
    renderError("Anime details could not load", "Try this title again in a moment.");
  }
}

async function openPlayer(mediaTypeValue, id, title, season = 0, episode = 0, options = {}) {
  renderLoading("Preparing your stream");
  const media = rememberMedia(getRemembered(mediaTypeValue, id), mediaTypeValue);
  try {
    const params = new URLSearchParams({ mediaType: mediaTypeValue });
    const audio =
      mediaTypeValue === "anime"
        ? normalizeAudioVariant(options.audio || localStorage.getItem(ANIME_AUDIO_KEY))
        : undefined;
    if (mediaTypeValue === "anime") {
      params.set("anilistId", String(id));
      params.set("episode", String(episode || 1));
      params.set("preferredAudio", audio);
    } else {
      params.set("tmdbId", String(id));
    }
    if (mediaTypeValue === "tv") {
      params.set("season", String(season || 1));
      params.set("episode", String(episode || 1));
    }
    const response = await requestJson(`/api/player/sources?${params}`);
    if (!response.sources?.length) throw new Error("No playback source available");
    const sources = response.sources.map((source) => ({
      ...source,
      url: autoplaySourceUrl(source.url),
    }));
    const rememberedId = readPlaybackPreference(localStorage, mediaTypeValue, audio);
    const preferred = findPreferredSource(sources, {
      explicitId: options.preferredSourceId,
      rememberedId,
      audioVariant: audio,
    });
    state.player = {
      sources,
      index: Math.max(0, sources.findIndex((source) => source.id === preferred?.id)),
      fullscreen: Boolean(options.fullscreen),
      media: { ...media, title: title || media.title, season, episode },
      audio,
      confirmed: false,
      historyStarted: false,
      attemptedSourceIds: new Set(),
      recovery: null,
      recoveryTimer: null,
    };
    renderPlayer();
  } catch (error) {
    console.error(error);
    renderError("Playback is unavailable", "Try again or choose another title. Stream servers can occasionally be busy.");
  }
}

function trustedPlaybackEvent(event) {
  const player = state.player;
  const source = player?.sources[player.index];
  const frame = document.querySelector("#player-frame");
  if (!player || !source || !frame || event.source !== frame.contentWindow) return null;
  if (event.origin !== source.providerOrigin) return null;
  return parsePlaybackEventName(event.data);
}

function clearPlaybackRecoveryTimer() {
  if (state.player?.recoveryTimer) window.clearTimeout(state.player.recoveryTimer);
  if (state.player) state.player.recoveryTimer = null;
}

function updatePlaybackRecoveryPanel() {
  const player = state.player;
  const root = document.querySelector("#playback-recovery");
  if (!player || !root) return;
  const source = player.sources[player.index];
  const fallback = player.recovery?.fallback;
  if (!player.recovery) {
    root.innerHTML = "";
    root.hidden = true;
    return;
  }
  root.hidden = false;
  root.innerHTML = `<section class="player-recovery" role="status" aria-live="polite"><p>${
    fallback
      ? source.capabilities?.events
        ? `${escapeHtml(source.label)} hasn’t started yet. Try ${escapeHtml(fallback.label)}?`
        : `Having trouble with ${escapeHtml(source.label)}? Try another server.`
      : "No other stable server remains in this session."
  }</p><div>${
    fallback
      ? `<button class="primary pressable" data-action="recovery-try">Try ${escapeHtml(fallback.label)}</button>`
      : `<button class="primary pressable" data-action="recovery-report">Report issue</button>`
  }<button class="glass-button pressable" data-action="server-sheet">Choose server</button><button class="text-button pressable" data-action="recovery-keep">Keep current</button></div></section>`;
}

function showPlaybackRecovery(reason = "timeout") {
  const player = state.player;
  if (!player || player.confirmed) return;
  const source = player.sources[player.index];
  const fallback = findNextFallbackSource(
    player.sources,
    source.id,
    player.attemptedSourceIds,
    player.audio,
  );
  player.recovery = { reason, fallback };
  updatePlaybackRecoveryPanel();
}

function armPlaybackRecovery() {
  const player = state.player;
  if (!player) return;
  clearPlaybackRecoveryTimer();
  player.recoveryTimer = window.setTimeout(
    () => showPlaybackRecovery("timeout"),
    PLAYBACK_RECOVERY_TIMEOUT_MS,
  );
}

function confirmPlaybackStarted() {
  const player = state.player;
  if (!player || player.confirmed) return;
  player.confirmed = true;
  player.recovery = null;
  clearPlaybackRecoveryTimer();
  updatePlaybackRecoveryPanel();
  if (!player.historyStarted) {
    player.historyStarted = true;
    void recordHistory(player.media);
  }
}

function selectPlayerSource(index, reason = "manual") {
  const player = state.player;
  const next = player?.sources[Number(index)];
  if (!player || !next) return;
  const current = player.sources[player.index];
  if (reason === "manual") {
    writePlaybackPreference(localStorage, player.media.media_type, next.id, next.audioVariant || player.audio);
    player.attemptedSourceIds = new Set();
    if (next.audioVariant) {
      player.audio = next.audioVariant;
      localStorage.setItem(ANIME_AUDIO_KEY, next.audioVariant);
    }
  } else if (reason === "recovery") {
    player.attemptedSourceIds.add(current.id);
  }
  player.index = Number(index);
  player.confirmed = false;
  player.recovery = null;
  closeSheet();
  renderPlayer();
}

async function advanceToNextEpisode() {
  const player = state.player;
  if (!player || player.media.media_type !== "tv" || player.nextEpisodeBusy || !state.settings.autoplayNext) return;
  player.nextEpisodeBusy = true;
  const season = Number(player.media.season || 1);
  const episode = Number(player.media.episode || 1);
  try {
    const [details, seasonData] = await Promise.all([
      tmdb("tv/" + player.media.id),
      tmdb("tv/" + player.media.id + "/season/" + season),
    ]);
    const next = resolveAdjacentEpisode(
      details.seasons || [],
      season,
      episode,
      seasonData.episodes || [],
      "next",
    );
    if (!next) {
      player.nextEpisodeBusy = false;
      showToast("That was the last episode.");
      return;
    }
    await openPlayer("tv", player.media.id, player.media.title, next.season, next.episode, {
      preferredSourceId: player.sources[player.index]?.id,
      fullscreen: player.fullscreen,
    });
  } catch (error) {
    player.nextEpisodeBusy = false;
    console.error("[mobile-next-episode]", error);
    showToast("The next episode could not be opened.", "warning");
  }
}

window.addEventListener("message", (event) => {
  const playbackEvent = trustedPlaybackEvent(event);
  if (playbackEvent === "play" || playbackEvent === "timeupdate") confirmPlaybackStarted();
  if (playbackEvent === "error") showPlaybackRecovery("error");
  if (playbackEvent === "ended") void advanceToNextEpisode();
});

document.addEventListener("visibilitychange", () => {
  if (!state.player || state.player.confirmed) return;
  if (document.hidden) clearPlaybackRecoveryTimer();
  else armPlaybackRecovery();
});

function renderPlayer() {
  const player = state.player;
  if (!player) return renderError("Player closed", "Choose a title to start watching.", false);
  const source = player.sources[player.index];
  const label = player.media.media_type === "tv"
    ? `S${player.media.season || 1} · E${player.media.episode || 1}`
    : player.media.media_type === "anime"
      ? `Episode ${player.media.episode || 1} · ${player.audio === "dub" ? "Dub" : "Sub"}`
      : "Movie";
  commit(`<section class="player-page"><div class="player-header"><button class="player-back pressable" data-action="back-detail" data-media="${player.media.media_type}" data-id="${player.media.id}">‹</button><div><span>${escapeHtml(label)}</span><strong>${escapeHtml(player.media.title)}</strong></div><button class="player-more pressable" data-action="server-sheet" aria-label="Choose playback server">•••</button></div><div class="player-stage"><div class="player-loader"><span></span><p>Connecting to ${escapeHtml(source.label || source.id)}</p></div><iframe id="player-frame" src="${escapeHtml(source.url)}" title="${escapeHtml(player.media.title)} player" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="origin-when-cross-origin"></iframe><button class="player-fullscreen pressable" data-action="player-fullscreen" aria-label="Enter full screen">⛶ Full screen</button></div><div id="playback-recovery" hidden></div><section class="server-row"><div><span>Playback server</span><strong>${escapeHtml(source.label || source.id)}</strong></div><button class="glass-button pressable" data-action="server-sheet">Choose server</button></section><section class="player-tip"><span>Tip</span><p>Full screen switches to landscape. StreamFree will ask before trying another server.</p></section></section>`, { root: state.previousRoot });
  document.querySelector("#player-frame")?.addEventListener("load", () => document.querySelector(".player-loader")?.classList.add("done"), { once: true });
  updatePlaybackRecoveryPanel();
  armPlaybackRecovery();
}

function showServerSheet() {
  if (!state.player) return;
  const groups = state.player.media.media_type === "anime"
    ? [
        ["Sub servers", state.player.sources.filter((source) => source.audioVariant === "sub")],
        ["Dub servers", state.player.sources.filter((source) => source.audioVariant === "dub")],
      ]
    : [["Video servers", state.player.sources]];
  const serverMarkup = groups.map(([groupLabel, sources]) => `<div class="server-group"><h3>${groupLabel}</h3>${sources.map((source) => {
    const index = state.player.sources.findIndex((entry) => entry.id === source.id);
    return `<button class="sheet-server pressable ${index === state.player.index ? "active" : ""}" data-action="server" data-index="${index}"><span>${source.audioVariant === "dub" ? "D" : source.audioVariant === "sub" ? "S" : index + 1}</span><div><strong>${escapeHtml(source.label || source.id)}</strong><small>${index === state.player.index ? "Currently playing" : source.providerTier === "stable" ? "Stable provider" : "Backup provider"}</small></div><b>${index === state.player.index ? "✓" : "›"}</b></button>`;
  }).join("")}</div>`).join("");
  const hasPreference = Boolean(readPlaybackPreference(localStorage, state.player.media.media_type, state.player.audio));
  sheetRoot.innerHTML = `<div class="sheet-backdrop" data-action="close-sheet"></div><section class="bottom-sheet" role="dialog" aria-modal="true" aria-label="Choose playback server"><i class="sheet-handle"></i><span class="eyebrow">Playback options</span><h2>Choose a server</h2><p>StreamFree will never switch a server you chose without asking.</p><div class="sheet-servers">${serverMarkup}</div>${hasPreference ? '<button class="glass-button pressable" data-action="server-reset">Reset to recommended</button>' : ""}<button class="sheet-close pressable" data-action="close-sheet">Done</button></section>`;
  requestAnimationFrame(() => sheetRoot.classList.add("open"));
}

function closeSheet() {
  sheetRoot.classList.remove("open");
  window.setTimeout(() => { sheetRoot.innerHTML = ""; }, 280);
}

function spaceMenuItem(icon, title, copy, route, badge = "") {
  return `<button class="space-menu-item pressable" data-route="${route}"><span class="menu-icon">${icon}</span><span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(copy)}</small></span>${badge ? `<i>${escapeHtml(badge)}</i>` : ""}<b>›</b></button>`;
}

function renderSpace() {
  const library = currentLibrary();
  const histories = currentHistory();
  if (!state.authReady) {
    commit('<section class="account-loading"><div class="profile-skeleton"></div><div class="line-skeleton"></div><div class="line-skeleton short"></div></section>', { root: "space" });
    return;
  }

  if (!state.user) {
    commit(`<section class="guest-hero"><div class="guest-orbit"><span>${escapeHtml(accountInitials())}</span></div><span class="eyebrow">Your StreamFree</span><h1>Take your library everywhere.</h1><p>Sign in with the same account you use on streamfree.online. Your movies, series and watch history will follow you.</p><div class="auth-actions"><button class="primary pressable" data-route="auth/login">Sign in</button><button class="glass-button pressable" data-route="auth/register">Create account</button></div>${state.authError ? `<div class="inline-alert warning">${escapeHtml(state.authError)}</div>` : ""}</section>
      <section class="guest-stats"><button class="stat-card pressable" data-route="space/library"><span>${library.length}</span><strong>Saved locally</strong><small>Your guest library</small></button><button class="stat-card pressable" data-route="space/history"><span>${histories.length}</span><strong>Recent watches</strong><small>On this device</small></button></section>
      <section class="space-menu">${spaceMenuItem("♡", "Library", "Saved movies, series and anime", "space/library", String(library.length))}${spaceMenuItem("◷", "Watch history", "Your recent playback", "space/history", String(histories.length))}${spaceMenuItem("⚙", "Playback settings", "Data use, motion and autoplay", "space/settings")}${spaceMenuItem("?", "Help & about", "Playback guidance and app details", "space/help")}</section>`, { root: "space" });
    return;
  }

  const username = state.profile?.username || state.user.email?.split("@")[0] || "StreamFree member";
  commit(`<section class="profile-hero"><div class="profile-glow"></div><button class="profile-avatar pressable" data-route="space/profile">${escapeHtml(accountInitials())}<i></i></button><span class="sync-badge"><i></i>${state.syncBusy ? "Syncing" : "Synced"}</span><h1>${escapeHtml(username)}</h1><p>${escapeHtml(state.user.email || "")}</p><button class="edit-profile pressable" data-route="space/profile">Edit profile</button></section>
    <section class="account-stats"><button class="stat-card pressable" data-route="space/library"><span>${library.length}</span><strong>In your library</strong><small>Synced titles</small></button><button class="stat-card pressable" data-route="space/history"><span>${histories.length}</span><strong>Watched</strong><small>Across devices</small></button></section>
    <section class="space-menu">${spaceMenuItem("♡", "My library", "Movies, series and saved anime", "space/library", String(library.length))}${spaceMenuItem("◷", "Watch history", "Continue from where you stopped", "space/history", String(histories.length))}${spaceMenuItem("⚙", "Playback settings", "Data use, motion and autoplay", "space/settings")}${spaceMenuItem("?", "Help & about", "Playback guidance and app details", "space/help")}${spaceMenuItem("⇥", "Sign out", "Keep this device in guest mode", "space/logout")}</section>`, { root: "space" });
}

function renderLibrary() {
  const items = currentLibrary();
  commit(`<section class="subpage-head"><button class="back-fab pressable" data-action="back">‹</button><span class="eyebrow">${state.user ? "Synced library" : "On this device"}</span><h1>My Library</h1><p>${items.length} saved title${items.length === 1 ? "" : "s"}</p></section>${items.length ? grid(items) : '<section class="empty-state compact"><div class="empty-icon">♡</div><h2>Your library is ready</h2><p>Save a title from its details page and it will appear here.</p><button class="primary pressable" data-route="browse">Browse titles</button></section>'}`, { root: "space" });
}

function renderHistory() {
  const items = currentHistory();
  commit(`<section class="subpage-head"><button class="back-fab pressable" data-action="back">‹</button><span class="eyebrow">${state.user ? "Across your devices" : "On this device"}</span><h1>Watch History</h1><p>Return to anything you started.</p></section>${items.length ? `<div class="history-list">${items.map((entry) => {
    const media = rememberMedia(entry, entry.type);
    const art = image(media.poster_path);
    const progress = historyProgress(entry);
    return `<article class="history-card"><button class="history-main pressable" data-action="detail" data-media="${media.media_type}" data-id="${media.id}">${art ? `<img src="${escapeHtml(art)}" alt="" />` : '<span class="history-fallback">SF</span>'}<span><small>${escapeHtml(historyDate(entry))}</small><strong>${escapeHtml(media.title)}</strong><i>${entry.season ? `Season ${entry.season} · Episode ${entry.episode}` : media.media_type === "movie" ? "Movie" : "Series"}</i><span class="history-progress"><b style="width:${progress}%"></b></span></span></button><button class="history-play pressable" data-action="play" data-media="${media.media_type}" data-id="${media.id}" data-title="${escapeHtml(media.title)}" data-season="${entry.season || 0}" data-episode="${entry.episode || 0}">▶</button></article>`;
  }).join("")}</div>` : '<section class="empty-state compact"><div class="empty-icon">◷</div><h2>No watches yet</h2><p>Start any movie or episode and it will be remembered here.</p><button class="primary pressable" data-route="home">Find something</button></section>'}`, { root: "space" });
}

function settingToggle(key, title, copy) {
  const active = Boolean(state.settings[key]);
  return `<button class="setting-row pressable" data-action="setting" data-setting="${key}" role="switch" aria-checked="${active}"><span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(copy)}</small></span><i class="switch ${active ? "active" : ""}"><b></b></i></button>`;
}

function renderSettings() {
  const selectedRegion = normalizeRegionOverride(readStorage(REGION_OVERRIDE_KEY, ""));
  const regionOptions = REGION_OPTIONS.map(([code, name]) => `<option value="${code}" ${code === selectedRegion ? "selected" : ""}>${name}</option>`).join("");
  commit(`<section class="subpage-head"><button class="back-fab pressable" data-action="back">‹</button><span class="eyebrow">Make it yours</span><h1>Playback settings</h1><p>Stored privately on this Android device.</p></section><section class="settings-card">${settingToggle("dataSaver", "Data saver", "Prefer lighter artwork while browsing")}${settingToggle("autoplayNext", "Autoplay next episode", "Keep a series moving when supported")}${settingToggle("reduceMotion", "Reduce motion", "Use simpler screen transitions")}</section><section class="settings-note region-note"><span>Home region</span><p>Automatic uses your connection region. Choose another region when travelling, then reset it anytime.</p><select id="region-preference" aria-label="Home region">${regionOptions}</select>${selectedRegion ? '<button class="glass-button pressable" data-action="reset-region">Reset to automatic</button>' : ""}</section><section class="settings-note"><span>Native Android beta</span><p>The app UI lives on your phone. Internet is used only for account sync, title information and playback providers.</p></section>`, { root: "space" });
  const updateCopy = state.update.status === "available" ? `Version ${state.update.manifest?.versionName || "new"} is ready to install.` : state.update.status === "checking" ? "Checking StreamFree for a newer build…" : state.update.status === "error" ? state.update.error : `Current version ${APP_VERSION}`;
  const updateAction = state.update.status === "available" ? `<button class="primary pressable settings-update-button" data-action="install-update">Install update</button>` : `<button class="glass-button pressable settings-update-button" data-action="check-update">${state.update.status === "checking" ? "Checking…" : "Check for update"}</button>`;
  const note = document.createElement("section");
  note.className = "settings-note update-note";
  note.innerHTML = `<span>Software update</span><p>${escapeHtml(updateCopy)}</p>${updateAction}`;
  document.querySelector(".settings-note")?.before(note);
}

function renderHelp() {
  commit(`<section class="subpage-head"><button class="back-fab pressable" data-action="back">‹</button><span class="eyebrow">StreamFree Android</span><h1>Help & about</h1><p>A local app experience powered by StreamFree's online catalogue and account services.</p></section><section class="faq-list"><details open><summary>Can I use my website account?</summary><p>Yes. Sign in with the exact same email and password. Movies, series, library items and history use the same Supabase account.</p></details><details><summary>Why does a stream take time to start?</summary><p>Playback providers operate independently. Try another numbered server from the player if the first one is busy.</p></details><details><summary>Does the app work offline?</summary><p>The interface and guest library live on your device. Posters, catalogue updates, account sync and streaming require internet.</p></details><details><summary>Is this a website wrapper?</summary><p>No. The navigation, screens, animations and account state are bundled in the APK. Only data and streams are requested online.</p></details></section><section class="about-card"><div class="about-logo">SF</div><div><strong>StreamFree for Android</strong><span>Version 1.1 · Account Sync Beta</span></div></section>`, { root: "space" });
}

function authShell(kind, body) {
  const copy = kind === "register" ? ["Join StreamFree", "One account for web and Android."] : kind === "forgot" ? ["Reset password", "We will send a secure recovery link."] : ["Welcome back", "Continue with your StreamFree account."];
  return `<section class="auth-page"><button class="back-fab pressable" data-action="back">‹</button><div class="auth-mark">SF<i></i></div><span class="eyebrow">Same account, every screen</span><h1>${copy[0]}</h1><p>${copy[1]}</p>${body}</section>`;
}

function field(name, label, type = "text", autocomplete = "") {
  return `<label class="field"><span>${escapeHtml(label)}</span><input name="${name}" type="${type}" ${autocomplete ? `autocomplete="${autocomplete}"` : ""} required /><small data-error-for="${name}"></small></label>`;
}

function renderAuth(kind = "login") {
  if (state.user) return setRoute("space", { replace: true });
  let body;
  if (kind === "register") {
    body = `<form id="register-form" class="auth-form">${field("username", "Username", "text", "username")}${field("email", "Email address", "email", "email")}${field("password", "Password", "password", "new-password")}${field("confirm", "Confirm password", "password", "new-password")}<div class="form-alert" hidden></div><button class="primary auth-submit pressable" type="submit">Create account</button></form><p class="auth-switch">Already a member? <button data-route="auth/login">Sign in</button></p>`;
  } else if (kind === "forgot") {
    body = `<form id="forgot-form" class="auth-form">${field("email", "Email address", "email", "email")}<div class="form-alert" hidden></div><button class="primary auth-submit pressable" type="submit">Send recovery email</button></form><p class="auth-switch"><button data-route="auth/login">Return to sign in</button></p>`;
  } else {
    body = `<form id="login-form" class="auth-form">${field("email", "Email address", "email", "email")}${field("password", "Password", "password", "current-password")}<button class="forgot-link" type="button" data-route="auth/forgot">Forgot password?</button><div class="form-alert" hidden></div><button class="primary auth-submit pressable" type="submit">Sign in</button></form><p class="auth-switch">New to StreamFree? <button data-route="auth/register">Create account</button></p>`;
  }
  commit(authShell(kind, body), { root: "space" });
}

function showFormError(form, message, fieldName = "") {
  form.querySelectorAll("[data-error-for]").forEach((element) => { element.textContent = ""; });
  const alert = form.querySelector(".form-alert");
  if (fieldName) {
    const target = form.querySelector(`[data-error-for="${fieldName}"]`);
    if (target) target.textContent = message;
  }
  alert.textContent = message;
  alert.hidden = false;
}

async function submitLogin(form) {
  if (!state.supabase) return showFormError(form, state.authError || "Account services are unavailable.");
  const values = new FormData(form);
  const email = String(values.get("email") || "").trim();
  const password = String(values.get("password") || "");
  const button = form.querySelector("button[type=submit]");
  setBusy(button, true, "Signing in");
  try {
    const { data, error } = await state.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    state.user = data.user;
    await loadAccountData({ mergeGuest: true });
    await notify(NotificationType.Success);
    showToast("Welcome back. Your library is synced.");
    setRoute("space", { replace: true });
  } catch (error) {
    showFormError(form, authMessage(error));
    await notify(NotificationType.Error);
  } finally {
    setBusy(button, false);
  }
}

async function submitRegister(form) {
  if (!state.supabase) return showFormError(form, state.authError || "Account services are unavailable.");
  const values = new FormData(form);
  const username = String(values.get("username") || "").trim();
  const email = String(values.get("email") || "").trim();
  const password = String(values.get("password") || "");
  const confirm = String(values.get("confirm") || "");
  if (username.length < 3 || username.length > 25) return showFormError(form, "Use a username between 3 and 25 characters.", "username");
  if (password.length < 8) return showFormError(form, "Password must be at least 8 characters.", "password");
  if (password !== confirm) return showFormError(form, "Passwords do not match.", "confirm");
  const button = form.querySelector("button[type=submit]");
  setBusy(button, true, "Creating account");
  try {
    const { data: existing, error: lookupError } = await state.supabase.from("profiles").select("id").eq("username", username).maybeSingle();
    if (lookupError) throw lookupError;
    if (existing) return showFormError(form, "That username is already taken.", "username");
    const { data, error } = await state.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: `${BACKEND_ORIGIN}/auth?form=login`,
      },
    });
    if (error) throw error;
    if (data.session) {
      state.user = data.user;
      await ensureProfile();
      await loadAccountData({ mergeGuest: true });
      showToast("Account created and synced.");
      setRoute("space", { replace: true });
    } else {
      commit(authShell("register", `<section class="confirmation-card"><span>✉</span><h2>Check your email</h2><p>Your account is ready. Open the confirmation link we sent to <strong>${escapeHtml(email)}</strong>, then return here to sign in.</p><button class="primary pressable" data-route="auth/login">Go to sign in</button></section>`), { root: "space" });
    }
    await notify(NotificationType.Success);
  } catch (error) {
    showFormError(form, authMessage(error));
    await notify(NotificationType.Error);
  } finally {
    setBusy(button, false);
  }
}

async function submitForgot(form) {
  if (!state.supabase) return showFormError(form, state.authError || "Account services are unavailable.");
  const email = String(new FormData(form).get("email") || "").trim();
  const button = form.querySelector("button[type=submit]");
  setBusy(button, true, "Sending email");
  try {
    const { error } = await state.supabase.auth.resetPasswordForEmail(email, { redirectTo: `${BACKEND_ORIGIN}/auth/reset-password` });
    if (error) throw error;
    commit(authShell("forgot", `<section class="confirmation-card"><span>✉</span><h2>Recovery email sent</h2><p>Open the secure link in your inbox to choose a new password.</p><button class="primary pressable" data-route="auth/login">Return to sign in</button></section>`), { root: "space" });
  } catch (error) {
    showFormError(form, authMessage(error));
  } finally {
    setBusy(button, false);
  }
}

function renderProfile() {
  const username = state.profile?.username || state.user?.user_metadata?.username || "";
  commit(`<section class="subpage-head"><button class="back-fab pressable" data-action="back">‹</button><span class="eyebrow">Account details</span><h1>Edit profile</h1><p>Your username appears on both web and Android.</p></section><form id="profile-form" class="auth-form profile-form">${field("username", "Username", "text", "username")}<label class="field disabled"><span>Email address</span><input value="${escapeHtml(state.user?.email || "")}" disabled /></label><div class="form-alert" hidden></div><button class="primary auth-submit pressable" type="submit">Save changes</button></form>`, { root: "space" });
  const input = document.querySelector('input[name="username"]');
  if (input) input.value = username;
}

async function submitProfile(form) {
  const username = String(new FormData(form).get("username") || "").trim();
  if (username.length < 3 || username.length > 25) return showFormError(form, "Use a username between 3 and 25 characters.", "username");
  const button = form.querySelector("button[type=submit]");
  setBusy(button, true, "Saving");
  try {
    const { data: existing } = await state.supabase.from("profiles").select("id").eq("username", username).neq("id", state.user.id).maybeSingle();
    if (existing) return showFormError(form, "That username is already taken.", "username");
    const { data, error } = await state.supabase.from("profiles").upsert({ id: state.user.id, username }, { onConflict: "id" }).select("username").single();
    if (error) throw error;
    await state.supabase.auth.updateUser({ data: { username } });
    state.profile = data;
    updateAccountChrome();
    showToast("Profile updated everywhere.");
    await notify(NotificationType.Success);
    setRoute("space");
  } catch (error) {
    showFormError(form, authMessage(error, "Could not update your profile."));
  } finally {
    setBusy(button, false);
  }
}

async function signOut() {
  if (!state.supabase) return;
  await state.supabase.auth.signOut();
  state.user = null;
  state.profile = null;
  state.watchlist = [];
  state.histories = [];
  updateAccountChrome();
  showToast("Signed out. Guest mode is ready.");
  setRoute("space", { replace: true });
}

async function render() {
  const route = routeFromHash();
  state.route = route;
  activateTab(route);
  const [kind, first, second] = route.split("/");
  try {
    if (kind === "home") await renderHome();
    else if (kind === "search") await renderSearch();
    else if (kind === "browse") await renderBrowse();
    else if (kind === "anime") await renderAnime();
    else if (kind === "space" && first === "library") renderLibrary();
    else if (kind === "space" && first === "history") renderHistory();
    else if (kind === "space" && first === "settings") renderSettings();
    else if (kind === "space" && first === "help") renderHelp();
    else if (kind === "space" && first === "profile" && state.user) renderProfile();
    else if (kind === "space" && first === "logout") await signOut();
    else if (kind === "space") renderSpace();
    else if (kind === "auth") renderAuth(first || "login");
    else if (kind === "detail" && first && second) await renderDetail(first, second);
    else setRoute("home", { replace: true });
  } catch (error) {
    console.error("[mobile-render]", error);
    renderError("This screen could not load", "Check your connection and try again.");
  }
}

document.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.target;
  if (form.id === "search-form") {
    const query = String(new FormData(form).get("query") || "").trim();
    if (query.length < 2) return showToast("Enter at least two characters.");
    void performSearch(query);
  }
  if (form.id === "login-form") void submitLogin(form);
  if (form.id === "register-form") void submitRegister(form);
  if (form.id === "forgot-form") void submitForgot(form);
  if (form.id === "profile-form") void submitProfile(form);
});

document.addEventListener("change", (event) => {
  if (event.target?.id !== "region-preference") return;
  const value = normalizeRegionOverride(event.target.value);
  if (value) writeStorage(REGION_OVERRIDE_KEY, value);
  else localStorage.removeItem(REGION_OVERRIDE_KEY);
  state.region = null;
  state.cache.clear();
  showToast(value ? `Home region set to ${regionName(value)}.` : "Home region reset to automatic.");
  void render();
});

document.addEventListener("click", (event) => {
  const tourAction = event.target.closest("[data-tour-action]")?.dataset.tourAction;
  if (tourAction) {
    event.preventDefault();
    if (tourAction === "skip" || state.tour.step >= TOUR_STEPS.length - 1) finishTour();
    else {
      state.tour.step += 1;
      renderTour();
    }
    return;
  }
  const route = event.target.closest("[data-route]")?.dataset.route;
  if (route) {
    event.preventDefault();
    void impact();
    setRoute(route);
    return;
  }

  const button = event.target.closest("[data-action]");
  if (!button) return;
  const { action, media, id, title, type, genre, filter, sort, season, episode, index, query, setting, audio } = button.dataset;
  void impact(action === "play" ? ImpactStyle.Medium : ImpactStyle.Light);

  if (action === "detail") setRoute(`detail/${media}/${id}`);
  if (action === "browse-type") { state.browseType = type; state.browseGenre = ""; state.browsePage = 1; void renderBrowse(); }
  if (action === "browse-filter") { state.browseFilter = filter; state.browseGenre = ""; state.browsePage = 1; void renderBrowse(); }
  if (action === "browse-genre") { state.browseType = type || state.browseType; state.browseGenre = genre || ""; state.browsePage = 1; setRoute("browse"); if (state.route === "browse") void renderBrowse(); }
  if (action === "browse-more") { state.browsePage += 1; void renderBrowse(); }
  if (action === "anime-sort") { state.animeSort = sort; void renderAnime(); }
  if (action === "season") { state.detailSeason = Number(season); void renderDetail(media, id); }
  if (action === "save") void toggleLibrary(getRemembered(media, id));
  if (action === "play") void openPlayer(media, Number(id), title, Number(season || 0), Number(episode || 0), { audio });
  if (action === "back-detail") { clearPlaybackRecoveryTimer(); void exitPlayerFullscreen(); setRoute(`detail/${media}/${id}`); }
  if (action === "player-fullscreen") void (playerIsFullscreen() ? exitPlayerFullscreen() : enterPlayerFullscreen());
  if (action === "back") window.history.back();
  if (action === "retry") void render();
  if (action === "scroll-top") window.scrollTo({ top: 0, behavior: state.settings.reduceMotion ? "instant" : "smooth" });
  if (action === "open-history") setRoute("space/history");
  if (action === "clear-searches") { writeStorage(RECENT_SEARCH_KEY, []); void renderSearch(); }
  if (action === "search-query") { const input = document.querySelector("#search-input"); if (input) input.value = query; void performSearch(query); }
  if (action === "server") selectPlayerSource(Number(index), "manual");
  if (action === "server-reset" && state.player) {
    clearPlaybackPreference(localStorage, state.player.media.media_type, state.player.audio);
    const recommended = findPreferredSource(state.player.sources, { audioVariant: state.player.audio });
    if (recommended) selectPlayerSource(state.player.sources.findIndex((source) => source.id === recommended.id), "reset");
  }
  if (action === "recovery-try" && state.player?.recovery?.fallback) {
    const fallbackIndex = state.player.sources.findIndex((source) => source.id === state.player.recovery.fallback.id);
    selectPlayerSource(fallbackIndex, "recovery");
  }
  if (action === "recovery-keep" && state.player) { state.player.recovery = null; updatePlaybackRecoveryPanel(); }
  if (action === "recovery-report" && state.player) { state.player.recovery = null; updatePlaybackRecoveryPanel(); showToast("Playback issue reported. Try another server."); }
  if (action === "server-sheet") showServerSheet();
  if (action === "close-sheet") closeSheet();
  if (action === "setting") { state.settings[setting] = !state.settings[setting]; writeStorage(SETTINGS_KEY, state.settings); document.documentElement.classList.toggle("reduce-motion", state.settings.reduceMotion); renderSettings(); }
  if (action === "reset-region") { localStorage.removeItem(REGION_OVERRIDE_KEY); state.region = null; state.cache.clear(); showToast("Home region reset to automatic."); renderSettings(); }
  if (action === "check-update") void checkForUpdate();
  if (action === "install-update") installUpdate();
  if (action === "trailer") {
    const url = `https://www.youtube.com/watch?v=${button.dataset.key}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }
});

document.addEventListener("pointerdown", (event) => {
  const target = event.target.closest(".pressable");
  if (!target) return;
  const rect = target.getBoundingClientRect();
  target.style.setProperty("--press-x", `${event.clientX - rect.left}px`);
  target.style.setProperty("--press-y", `${event.clientY - rect.top}px`);
  target.classList.add("pressed");
  window.setTimeout(() => target.classList.remove("pressed"), 420);
});

let touchStart = null;
view.addEventListener("touchstart", (event) => {
  const touch = event.touches[0];
  touchStart = { x: touch.clientX, y: touch.clientY, at: Date.now() };
}, { passive: true });

view.addEventListener("touchend", (event) => {
  if (!touchStart || state.route.includes("/") || event.target.closest(".rail, .filter-scroll, .chips, .season-tabs, input, iframe")) return;
  const touch = event.changedTouches[0];
  const dx = touch.clientX - touchStart.x;
  const dy = touch.clientY - touchStart.y;
  if (Math.abs(dx) > 82 && Math.abs(dx) > Math.abs(dy) * 1.5 && Date.now() - touchStart.at < 550) {
    const current = TAB_ORDER.indexOf(rootRoute(state.route));
    const next = dx < 0 ? current + 1 : current - 1;
    if (TAB_ORDER[next]) {
      void impact();
      setRoute(TAB_ORDER[next]);
    }
  }
  touchStart = null;
}, { passive: true });

function updateNetworkState() {
  const offline = typeof navigator !== "undefined" && navigator.onLine === false;
  networkBanner.hidden = !offline;
  document.body.classList.toggle("offline", offline);
}

window.addEventListener("online", () => {
  updateNetworkState();
  showToast("Back online. Syncing your account.");
  if (state.user) void loadAccountData({ mergeGuest: true });
  void render();
});
window.addEventListener("offline", updateNetworkState);
window.addEventListener("hashchange", () => void render());

async function initializeNativeShell() {
  if (!nativePlatform()) return;
  try {
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: "#070609" });
  } catch {
    // Status bar APIs vary by Android version and edge-to-edge mode.
  }

  await NativeApp.addListener("backButton", () => {
    if (sheetRoot.classList.contains("open")) closeSheet();
    else if (playerIsFullscreen()) void exitPlayerFullscreen();
    else if (routeFromHash() !== "home") window.history.back();
    else NativeApp.exitApp();
  });
  await NativeApp.addListener("appStateChange", ({ isActive }) => {
    if (isActive && state.user) void loadAccountData();
  });
}

document.documentElement.classList.toggle("reduce-motion", state.settings.reduceMotion);
updateNetworkState();
updateAccountChrome();
void initializeNativeShell();
window.setTimeout(() => {
  app.hidden = false;
  void render().then(maybeShowTour);
  void initializeAuth();
}, state.settings.reduceMotion ? 120 : 450);
