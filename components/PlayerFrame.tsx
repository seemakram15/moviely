"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { SOURCES, PLAYER_ORIGINS, originOf } from "@/lib/players";
import {
  addToHistory,
  getDataSaver,
  setDataSaver,
  recordSourceSpeed,
  getSourceSpeeds,
} from "@/lib/userStore";

type Props = {
  tmdbId: number;
  kind: "movie" | "tv";
  season?: number;
  episode?: number;
  title?: string;
  poster?: string;
};

const PREFS_KEY = "moviely:playerPrefs";
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

/** Sort SOURCES putting fastest-known first, unknowns after. */
function rankSources(speeds: Record<string, number>) {
  return [...SOURCES].sort((a, b) => {
    const sa = speeds[a.id] ?? Infinity;
    const sb = speeds[b.id] ?? Infinity;
    return sa - sb;
  });
}

export default function PlayerFrame({ tmdbId, kind, season, episode, title, poster }: Props) {
  const [sourceId, setSourceId] = useState<string>(SOURCES[0].id);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [started, setStarted] = useState(false);
  const [exhausted, setExhausted] = useState<string[]>([]);
  const [autoSwitched, setAutoSwitched] = useState<string | null>(null);
  const [dataSaver, setDataSaverState] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false); // mobile source sheet
  const [miniPlayer, setMiniPlayer] = useState(false);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [networkRestored, setNetworkRestored] = useState(false);

  // Progress bar state
  const [barMode, setBarMode] = useState<null | "loading" | "playing">(null);
  const [loadPct, setLoadPct] = useState(0);    // 0-100 during loading phase
  const [bufferPct, setBufferPct] = useState(0); // 0-100 during loading phase
  const [playPct, setPlayPct] = useState(0);     // 0-100 real-time playback position
  const [bufAheadPct, setBufAheadPct] = useState(0); // buffer bar (ahead of playPct)

  const progressTimers = useRef<ReturnType<typeof setInterval>[]>([]);
  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playElapsed = useRef(0); // seconds since playback started
  const loadStartMs = useRef<number>(0);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const skipIntroTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipIntroDismiss = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipeStartY = useRef<number | null>(null);

  // Ranked sources (fastest first based on historical speed)
  const rankedSources = useMemo(() => rankSources(getSourceSpeeds()), [started]); // eslint-disable-line react-hooks/exhaustive-deps

  // Init: load prefs + data saver
  useEffect(() => {
    const ds = getDataSaver();
    setDataSaverState(ds);

    if (!ds) PLAYER_ORIGINS.forEach(preconnect);

    const raw = typeof window !== "undefined" ? localStorage.getItem(PREFS_KEY) : null;
    const p = loadPrefs();
    setSourceId(!raw && (isSlowNetwork() || ds) ? rankedSources[0].id : p.sourceId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify({ sourceId })); } catch {}
  }, [sourceId]);

  const src = useMemo(() => {
    const source = SOURCES.find((s) => s.id === sourceId) ?? SOURCES[0];
    const opts = { autoplay: true };
    return kind === "movie"
      ? source.movie(tmdbId, opts)
      : source.tv(tmdbId, season ?? 1, episode ?? 1, opts);
  }, [sourceId, tmdbId, kind, season, episode]);

  const activeSource = SOURCES.find((s) => s.id === sourceId) ?? SOURCES[0];

  // Auto-failover
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

  // Reset on title/episode change
  useEffect(() => {
    setExhausted([]);
    setAutoSwitched(null);
    setStarted(false);
    setBarMode(null);
    setLoadPct(0);
    setBufferPct(0);
    setPlayPct(0);
    setBufAheadPct(0);
    playElapsed.current = 0;
    if (playTimerRef.current) { clearInterval(playTimerRef.current); playTimerRef.current = null; }
    setMiniPlayer(false);
    setShowSkipIntro(false);
  }, [tmdbId, season, episode]);

  // Loading progress animation
  useEffect(() => {
    progressTimers.current.forEach(clearInterval);
    progressTimers.current = [];
    if (!started || !loading) return;

    setBarMode("loading");
    setLoadPct(0);
    setBufferPct(0);
    loadStartMs.current = Date.now();

    let pct = 0;
    const stage1 = setInterval(() => {
      pct = Math.min(35, pct + 2.5);
      setLoadPct(pct);
      setBufferPct(Math.min(100, pct + 14));
      if (pct >= 35) clearInterval(stage1);
    }, 40);
    const stage2 = setInterval(() => {
      if (pct < 35) return;
      pct = Math.min(78, pct + 0.4);
      setLoadPct(pct);
      setBufferPct(Math.min(100, pct + 14));
      if (pct >= 78) clearInterval(stage2);
    }, 80);

    progressTimers.current = [stage1, stage2];
    return () => { progressTimers.current.forEach(clearInterval); };
  }, [started, sourceId]); // eslint-disable-line react-hooks/exhaustive-deps

  // On iframe load: record speed, then start real-time playback progress bar
  useEffect(() => {
    if (!loading && started) {
      progressTimers.current.forEach(clearInterval);

      if (loadStartMs.current > 0) {
        recordSourceSpeed(sourceId, Date.now() - loadStartMs.current);
        loadStartMs.current = 0;
      }

      // Snap loading bar to 100% briefly, then switch to playback mode
      setLoadPct(100);
      setBufferPct(100);
      const t = setTimeout(() => {
        setBarMode("playing");
        playElapsed.current = 0;
        setPlayPct(0);
        setBufAheadPct(8); // start grey bar 8% ahead

        // ponytail: assumed duration — can't read iframe; 7200s covers most movies
        const duration = kind === "tv" ? 2520 : 7200;
        if (playTimerRef.current) clearInterval(playTimerRef.current);
        playTimerRef.current = setInterval(() => {
          playElapsed.current += 1;
          const p = Math.min(100, (playElapsed.current / duration) * 100);
          // buffer stays 8-20% ahead, grows slowly to simulate ongoing preload
          const ahead = 8 + Math.min(12, playElapsed.current * 0.015);
          const b = Math.min(100, p + ahead);
          setPlayPct(p);
          setBufAheadPct(b);
        }, 1000);
      }, 400);

      return () => {
        clearTimeout(t);
        if (playTimerRef.current) { clearInterval(playTimerRef.current); playTimerRef.current = null; }
      };
    }
  }, [loading, started, sourceId, kind]); // eslint-disable-line react-hooks/exhaustive-deps

  // Skip intro: show 60s after iframe loads, auto-dismiss after 30 more seconds
  useEffect(() => {
    if (loading || !started) return;
    if (skipIntroTimer.current) clearTimeout(skipIntroTimer.current);
    if (skipIntroDismiss.current) clearTimeout(skipIntroDismiss.current);

    skipIntroTimer.current = setTimeout(() => {
      setShowSkipIntro(true);
      skipIntroDismiss.current = setTimeout(() => setShowSkipIntro(false), 30_000);
    }, 60_000);

    return () => {
      if (skipIntroTimer.current) clearTimeout(skipIntroTimer.current);
      if (skipIntroDismiss.current) clearTimeout(skipIntroDismiss.current);
    };
  }, [loading, started, sourceId]);

  // Mini player: IntersectionObserver on the player container
  useEffect(() => {
    if (!started || !playerContainerRef.current) return;
    const el = playerContainerRef.current;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && started && !loading) setMiniPlayer(true);
        else setMiniPlayer(false);
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [started, loading]);

  // Retry on network restore
  useEffect(() => {
    if (!started) return;
    const onOnline = () => {
      if (loading) setNetworkRestored(true);
    };
    const onOffline = () => setNetworkRestored(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [started, loading]);

  useEffect(() => {
    if (networkRestored) {
      setNetworkRestored(false);
      setLoading(true);
    }
  }, [networkRestored]);

  // Keyboard: Escape exits expanded
  useEffect(() => {
    if (!expanded) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setExpanded(false); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  // Swipe up to fullscreen on mobile
  const onTouchStart = (e: React.TouchEvent) => {
    swipeStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (swipeStartY.current === null) return;
    const dy = swipeStartY.current - e.changedTouches[0].clientY;
    if (dy > 60) setExpanded(true);   // swipe up → fullscreen
    if (dy < -60) setExpanded(false); // swipe down → exit
    swipeStartY.current = null;
  };

  const switchSource = (id: string) => {
    if (id === sourceId) return;
    setLoading(true);
    setAutoSwitched(null);
    setSourceId(id);
    setExhausted([]);
    setSheetOpen(false);
  };

  const tryNextSource = () => {
    const next = SOURCES.find((s) => s.id !== sourceId && !exhausted.includes(s.id));
    if (!next) { setExhausted([]); return; }
    setExhausted((prev) => [...prev, sourceId]);
    setLoading(true);
    setAutoSwitched(null);
    setSourceId(next.id);
  };

  const handlePlay = () => {
    setStarted(true);
    if (title) {
      addToHistory({ tmdbId, kind, title, poster: poster ?? null });
    }
  };

  const toggleDataSaver = () => {
    const next = !dataSaver;
    setDataSaverState(next);
    setDataSaver(next);
  };

  const speeds = getSourceSpeeds();

  const speedLabel = (id: string) => {
    const ms = speeds[id];
    if (!ms) return null;
    if (ms < 2000) return "Fast";
    if (ms < 5000) return "OK";
    return "Slow";
  };

  const speedColor = (id: string) => {
    const ms = speeds[id];
    if (!ms) return "text-neutral-400";
    if (ms < 2000) return "text-green-400";
    if (ms < 5000) return "text-yellow-400";
    return "text-red-400";
  };

  const playerInner = (mini = false) => (
    <>
      {loading && !mini && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-neutral-950">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-red-500" />
            <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
              Loading {activeSource.name}…
            </p>
            {dataSaver && (
              <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-400 ring-1 ring-green-500/20">
                Data Saver ON
              </span>
            )}
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

      {/* Loading bar */}
      {!mini && barMode === "loading" && (
        <div className="absolute bottom-0 left-0 right-0 z-20" style={{ pointerEvents: "none" }}>
          <div className="relative h-[3px] w-full bg-white/10">
            <div
              className="absolute left-0 top-0 h-full bg-white/30 transition-[width] duration-300 ease-out"
              style={{ width: `${bufferPct}%` }}
            />
            <div
              className="absolute left-0 top-0 h-full bg-red-500 transition-[width] duration-200 ease-out"
              style={{ width: `${loadPct}%` }}
            />
            <div
              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 shadow-lg shadow-red-500/60 transition-[left] duration-200 ease-out"
              style={{ left: `${loadPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between px-2 pb-1 pt-1">
            <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              Buffering…
            </span>
            <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] tabular-nums text-white/50 backdrop-blur-sm">
              {Math.round(loadPct)}%
            </span>
          </div>
        </div>
      )}

      {/* Real-time playback bar: red = elapsed, grey = buffered ahead */}
      {!mini && barMode === "playing" && (
        <div className="absolute bottom-0 left-0 right-0 z-20 group/bar" style={{ pointerEvents: "none" }}>
          <div className="relative h-[3px] w-full bg-white/10">
            {/* Grey buffer bar */}
            <div
              className="absolute left-0 top-0 h-full bg-white/35"
              style={{ width: `${bufAheadPct}%`, transition: "width 1s linear" }}
            />
            {/* Red playback bar */}
            <div
              className="absolute left-0 top-0 h-full bg-red-500"
              style={{ width: `${playPct}%`, transition: "width 1s linear" }}
            />
            {/* Scrubber dot */}
            <div
              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 shadow shadow-red-500/50"
              style={{ left: `${playPct}%`, transition: "left 1s linear" }}
            />
          </div>
        </div>
      )}

      {/* Skip Intro button */}
      {!mini && showSkipIntro && (
        <div className="absolute bottom-10 right-4 z-30">
          <button
            type="button"
            onClick={() => setShowSkipIntro(false)}
            className="flex items-center gap-2 rounded-lg border border-white/30 bg-black/80 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            Skip Intro
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className="w-full">
      {/* Main player */}
      <div
        ref={playerContainerRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
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
            onMouseEnter={() => !dataSaver && preconnect(originOf(activeSource))}
            onTouchStart={() => !dataSaver && preconnect(originOf(activeSource))}
            onClick={handlePlay}
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
              <span className="text-sm font-bold tracking-wide text-white">Play</span>
              {dataSaver && (
                <span className="rounded-full bg-green-500/20 px-3 py-0.5 text-[10px] font-semibold text-green-400 ring-1 ring-green-500/30">
                  Data Saver ON
                </span>
              )}
            </div>
          </button>
        ) : (
          playerInner()
        )}

        {/* Fullscreen toggle */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? "Exit fullscreen" : "Enter fullscreen"}
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

      {/* Mini player — fixed bottom-right when main player scrolls out of view */}
      {miniPlayer && started && !loading && (
        <div className="fixed bottom-4 right-4 z-[90] overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/10"
          style={{ width: 320, aspectRatio: "16/9" }}>
          <div className="relative h-full w-full bg-black">
            {playerInner(true)}
          </div>
          <button
            type="button"
            onClick={() => setMiniPlayer(false)}
            aria-label="Close mini player"
            className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-black/80 text-white ring-1 ring-white/20 hover:bg-black"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => { setMiniPlayer(false); playerContainerRef.current?.scrollIntoView({ behavior: "smooth" }); }}
            aria-label="Expand player"
            className="absolute left-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-black/80 text-white ring-1 ring-white/20 hover:bg-black"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}

      {/* Failover notice */}
      {autoSwitched && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 p-3 text-sm text-sky-200">
          <span>Previous source was too slow — switched to <strong>{autoSwitched}</strong>.</span>
          <button type="button" onClick={() => setAutoSwitched(null)} className="ml-auto text-xs text-sky-200/60 hover:text-sky-200">Dismiss</button>
        </div>
      )}

      {/* Controls */}
      <div className="mt-4 space-y-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
        {started && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={tryNextSource}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-neutral-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              Not playing? Try next source
            </button>
            {/* Mobile: source sheet trigger */}
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-neutral-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white sm:hidden"
            >
              Change Source
            </button>
          </div>
        )}

        {/* Desktop source picker */}
        <div className="hidden sm:block">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Source</span>
            {/* Data saver toggle */}
            <button
              type="button"
              onClick={toggleDataSaver}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold transition ring-1 ${
                dataSaver
                  ? "bg-green-500/15 text-green-400 ring-green-500/30 hover:bg-green-500/25"
                  : "bg-white/5 text-neutral-400 ring-white/10 hover:text-white"
              }`}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" />
                <path d="M22 4 12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {dataSaver ? "Data Saver ON" : "Data Saver"}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {rankedSources.map((s) => {
              const active = s.id === sourceId;
              const label = speedLabel(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onMouseEnter={() => !dataSaver && preconnect(originOf(s))}
                  onTouchStart={() => !dataSaver && preconnect(originOf(s))}
                  onClick={() => switchSource(s.id)}
                  className={`group flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/25"
                      : "border border-white/10 bg-white/5 text-neutral-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {s.name}
                  {label && (
                    <span className={`text-[9px] font-bold uppercase ${active ? "text-white/70" : speedColor(s.id)}`}>
                      {label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
            Sources ranked by your connection speed.{" "}
            <strong className="text-neutral-400">Quality auto-adapts</strong> to your internet.
          </p>
        </div>

        {/* Mobile: only data saver visible inline (source sheet for source pick) */}
        <div className="flex items-center justify-between sm:hidden">
          <span className="text-[11px] text-neutral-500">
            Active: <strong className="text-neutral-300">{activeSource.name}</strong>
          </span>
          <button
            type="button"
            onClick={toggleDataSaver}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold transition ring-1 ${
              dataSaver
                ? "bg-green-500/15 text-green-400 ring-green-500/30"
                : "bg-white/5 text-neutral-400 ring-white/10"
            }`}
          >
            {dataSaver ? "Data Saver ON" : "Data Saver"}
          </button>
        </div>
      </div>

      {/* Mobile bottom sheet */}
      {sheetOpen && (
        <>
          <div
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm sm:hidden"
            onClick={() => setSheetOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-[81] rounded-t-2xl bg-neutral-900 p-5 pb-8 shadow-2xl ring-1 ring-white/10 sm:hidden">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Choose Source</h3>
              <button type="button" onClick={() => setSheetOpen(false)} className="text-neutral-400 hover:text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <p className="mb-4 text-xs text-neutral-500">Ranked by your speed history</p>
            <div className="space-y-2">
              {rankedSources.map((s) => {
                const active = s.id === sourceId;
                const label = speedLabel(s.id);
                const ms = speeds[s.id];
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => switchSource(s.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
                      active
                        ? "bg-gradient-to-r from-red-500/20 to-orange-500/10 ring-1 ring-red-500/40"
                        : "bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${active ? "bg-red-500" : "bg-neutral-600"}`} />
                    <span className="flex-1 text-sm font-semibold text-white">{s.name}</span>
                    {label && (
                      <span className={`text-[10px] font-bold ${speedColor(s.id)}`}>{label}</span>
                    )}
                    {ms && (
                      <span className="text-[10px] text-neutral-500">{(ms / 1000).toFixed(1)}s</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
