// Client-side persistence — watch history, watchlist, source speeds, data-saver pref.
// All reads return safe defaults when called on the server (SSR / RSC).

export type WatchHistoryItem = {
  tmdbId: number;
  kind: "movie" | "tv";
  title: string;
  poster: string | null;
  addedAt: number;
};

export type WatchlistItem = {
  tmdbId: number;
  kind: "movie" | "tv";
  title: string;
  poster: string | null;
  addedAt: number;
};

type SpeedMap = Record<string, number>; // sourceId → smoothed ms

const K = {
  history: "moviely:history",
  watchlist: "moviely:watchlist",
  speeds: "moviely:sourceSpeeds",
  dataSaver: "moviely:dataSaver",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ── Watch History ──────────────────────────────────────────────────────────

export function getWatchHistory(): WatchHistoryItem[] {
  return read<WatchHistoryItem[]>(K.history, []);
}

export function addToHistory(item: Omit<WatchHistoryItem, "addedAt">) {
  const existing = getWatchHistory().filter((h) => h.tmdbId !== item.tmdbId);
  write(K.history, [{ ...item, addedAt: Date.now() }, ...existing].slice(0, 24));
}

export function removeFromHistory(tmdbId: number) {
  write(K.history, getWatchHistory().filter((h) => h.tmdbId !== tmdbId));
}

// ── Watchlist ──────────────────────────────────────────────────────────────

export function getWatchlist(): WatchlistItem[] {
  return read<WatchlistItem[]>(K.watchlist, []);
}

export function isInWatchlist(tmdbId: number): boolean {
  return getWatchlist().some((w) => w.tmdbId === tmdbId);
}

/** Returns the new state (true = added, false = removed). */
export function toggleWatchlist(item: Omit<WatchlistItem, "addedAt">): boolean {
  const list = getWatchlist();
  const exists = list.some((w) => w.tmdbId === item.tmdbId);
  if (exists) {
    write(K.watchlist, list.filter((w) => w.tmdbId !== item.tmdbId));
    return false;
  }
  write(K.watchlist, [{ ...item, addedAt: Date.now() }, ...list]);
  return true;
}

// ── Source speed memory ────────────────────────────────────────────────────

export function recordSourceSpeed(sourceId: string, ms: number) {
  const map = read<SpeedMap>(K.speeds, {});
  const prev = map[sourceId];
  // Exponential moving average α=0.3 — new observations shift the average gently
  map[sourceId] = prev !== undefined ? Math.round(prev * 0.7 + ms * 0.3) : ms;
  write(K.speeds, map);
}

export function getSourceSpeeds(): SpeedMap {
  return read<SpeedMap>(K.speeds, {});
}

// ── Data saver ─────────────────────────────────────────────────────────────

export function getDataSaver(): boolean {
  return read<boolean>(K.dataSaver, false);
}

export function setDataSaver(val: boolean) {
  write(K.dataSaver, val);
}
