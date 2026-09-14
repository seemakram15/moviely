"use client";

import { useEffect, useMemo, useState } from "react";
import { SOURCES, PLAYER_ORIGINS, originOf } from "@/lib/players";

type Props = {
  tmdbId: number;
  kind: "movie" | "tv";
  season?: number;
  episode?: number;
  /** Backdrop URL shown on the facade before playback starts. */
  poster?: string;
};

const PREFS_KEY = "moviely:playerPrefs";

// How long a source gets to return its document before we give up on it and
// try the next one.
const LOAD_BUDGET_MS = 15000;

type Prefs = { sourceId: string };

function loadPrefs(): Prefs {
  if (typeof window === "undefined") return { sourceId: SOURCES[0].id };
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { sourceId: SOURCES[0].id };
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return {
      sourceId: SOURCES.some((s) => s.id === parsed.sourceId) ? parsed.sourceId! : SOURCES[0].id,
    };
  } catch {
    return { sourceId: SOURCES[0].id };
  }
}

// Add <link rel="preconnect"> + <link rel="dns-prefetch"> once per origin.
// Warms DNS + TLS so the iframe starts fetching video bytes sooner.
function preconnect(href: string) {
  if (typeof document === "undefined" || !href) return;
  if (!document.head.querySelector(`link[rel="preconnect"][href="${href}"]`)) {
    const pc = document.createElement("link");
    pc.rel = "preconnect";
    pc.href = href;
    pc.crossOrigin = "";
    document.head.appendChild(pc);
  }
  if (!document.head.querySelector(`link[rel="dns-prefetch"][href="${href}"]`)) {
    const dns = document.createElement("link");
    dns.rel = "dns-prefetch";
    dns.href = href;
    document.head.appendChild(dns);
  }
}

function isSlowNetwork(): boolean {
  if (typeof navigator === "undefined") return false;
  const c = (navigator as unknown as {
    connection?: { effectiveType?: string; downlink?: number; saveData?: boolean };
  }).connection;
  if (!c) return false;
  if (c.saveData) return true;
  if (c.effectiveType && /^(slow-2g|2g|3g)$/.test(c.effectiveType)) return true;
  if (typeof c.downlink === "number" && c.downlink < 1.5) return true;
  return false;
}

export default function PlayerFrame({ tmdbId, kind, season, episode, poster }: Props) {
  const [sourceId, setSourceId] = useState<string>(SOURCES[0].id);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  // Iframe is not mounted until the user presses play — lazy-loads the embed
  // instead of fetching it before the viewer has asked for it.
  const [started, setStarted] = useState(false);
  // Sources we already gave up on for this title, so failover never loops.
  const [exhausted, setExhausted] = useState<string[]>([]);
  const [autoSwitched, setAutoSwitched] = useState<string | null>(null);

  useEffect(() => {
    PLAYER_ORIGINS.forEach(preconnect);

    const raw = typeof window !== "undefined" ? localStorage.getItem(PREFS_KEY) : null;
    const p = loadPrefs();
    // No stored choice + slow link → start on the lightest player.
    setSourceId(!raw && isSlowNetwork() ? "videasy" : p.sourceId);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ sourceId }));
    } catch {}
  }, [sourceId]);

  const src = useMemo(() => {
    const source = SOURCES.find((s) => s.id === sourceId) ?? SOURCES[0];
    const opts = { autoplay: true };
    return kind === "movie"
      ? source.movie(tmdbId, opts)
      : source.tv(tmdbId, season ?? 1, episode ?? 1, opts);
  }, [sourceId, tmdbId, kind, season, episode]);

  const activeSource = SOURCES.find((s) => s.id === sourceId) ?? SOURCES[0];

  // --- Auto-failover -------------------------------------------------------
  // We can't see inside the iframe, but we can see whether its document ever
  // loaded. If a source hasn't answered within the budget it's dead or too
  // slow — move to the next one automatically instead of leaving the user on a
  // spinner. Cleared the moment onLoad fires.
  useEffect(() => {
    if (!started || !loading) return;
    const timer = setTimeout(() => {
      const next = SOURCES.find((s) => s.id !== sourceId && !exhausted.includes(s.id));
      if (!next) return;
      setExhausted((prev) => [...prev, sourceId]);
      setAutoSwitched(next.name);
      setSourceId(next.id);
    }, LOAD_BUDGET_MS);
    return () => clearTimeout(timer);
  }, [started, loading, sourceId, exhausted]);

  // New title / episode → everything gets a fresh chance.
  useEffect(() => {
    setExhausted([]);
    setAutoSwitched(null);
    setStarted(false);
  }, [tmdbId, season, episode]);

  useEffect(() => {
    if (!expanded) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  const switchSource = (id: string) => {
    if (id === sourceId) return;
    setLoading(true);
    setAutoSwitched(null);
    setSourceId(id);
    // A manual pick means the user vouches for it — clear the give-up list so
    // failover can still rescue them if this one also stalls.
    setExhausted([]);
  };

  // "Try next source" — what the user reaches for when a source loaded fine but
  // the video never actually plays (which we can't detect from out here).
  const tryNextSource = () => {
    const next = SOURCES.find((s) => s.id !== sourceId && !exhausted.includes(s.id));
    if (!next) {
      setExhausted([]);
      return;
    }
    setExhausted((prev) => [...prev, sourceId]);
    setLoading(true);
    setAutoSwitched(null);
    setSourceId(next.id);
  };

  return (
    <div className="w-full">
      <div
        className={
          expanded
            ? "fixed inset-0 z-[100] bg-black"
            : "group/player relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-black shadow-2xl shadow-black/60 ring-1 ring-white/10 transition hover:ring-white/20 sm:aspect-video"
        }
        style={expanded ? { position: "fixed" } : undefined}
      >
        {!started ? (
          <button
            type="button"
            onMouseEnter={() => preconnect(originOf(activeSource))}
            onTouchStart={() => preconnect(originOf(activeSource))}
            onClick={() => setStarted(true)}
            className="absolute inset-0 z-20 grid h-full w-full place-items-center"
            aria-label="Play"
          >
            {poster && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={poster}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-50"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
            <div className="relative flex flex-col items-center gap-4">
              <span className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-red-500 to-orange-500 shadow-2xl shadow-red-500/40 transition group-hover/player:scale-105">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              <span className="text-sm font-bold tracking-wide text-white">
                Play
              </span>
            </div>
          </button>
        ) : (
          <>
            {loading && (
              <div className="absolute inset-0 z-10 grid place-items-center bg-neutral-950">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-red-500" />
                  <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                    Loading {activeSource.name}…
                  </p>
                </div>
              </div>
            )}
            <iframe
              key={src}
              src={src}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="no-referrer"
              loading="eager"
              onLoad={() => setLoading(false)}
              className="absolute inset-0 h-full w-full"
            />
          </>
        )}

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? "Exit fullscreen" : "Enter fullscreen"}
          title={expanded ? "Exit fullscreen (Esc)" : "Fullscreen"}
          className="absolute right-3 top-3 z-30 grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/70 text-white backdrop-blur transition hover:border-white/50 hover:bg-black/90"
        >
          {expanded ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Failover notice */}
      {autoSwitched && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 p-3 text-sm text-sky-200">
          <span>
            Previous source was too slow — switched to{" "}
            <strong>{autoSwitched}</strong>.
          </span>
          <button
            type="button"
            onClick={() => setAutoSwitched(null)}
            className="ml-auto text-xs text-sky-200/60 hover:text-sky-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="mt-4 space-y-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
        {started && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={tryNextSource}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-neutral-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              Not playing? Try next source
            </button>
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
              Source
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SOURCES.map((s) => {
              const active = s.id === sourceId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onMouseEnter={() => preconnect(originOf(s))}
                  onTouchStart={() => preconnect(originOf(s))}
                  onClick={() => switchSource(s.id)}
                  title={s.name}
                  className={`group flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/25"
                      : "border border-white/10 bg-white/5 text-neutral-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
            Every player auto-adapts{" "}
            <strong className="text-neutral-400">quality to your internet speed</strong>,
            and a stalled source is swapped out automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
