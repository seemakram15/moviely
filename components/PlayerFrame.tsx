"use client";

import { useEffect, useMemo, useState } from "react";
import { SOURCES, PLAYER_ORIGINS, originOf } from "@/lib/players";

// ---------------------------------------------------------------------------
// Why this component looks the way it does — the anti-popup strategy.
//
// Embed players show "onclick" popunder ads by calling window.open() from
// inside their iframe. We can't reach into a cross-origin iframe to stop that,
// and `sandbox` is out because players detect it and refuse to play.
//
// So we exploit an asymmetry the browser already gives us:
//
//   * TRANSIENT activation (needed for window.open) is delivered ONLY to the
//     frame that actually received the click, plus its ancestors. It does NOT
//     flow down into a child iframe.
//   * STICKY activation ("has the user interacted with this page at all") is
//     page-wide and IS delegated to iframes carrying allow="autoplay".
//
// Therefore: if playback is started by a click on OUR play button and the
// iframe is mounted with autoplay, the video plays (sticky activation) while
// the iframe never receives transient activation — so any window.open() it
// attempts is dropped by the browser's own popup blocker, silently, with no
// sandbox for the player to detect.
//
// Ceiling: once the user clicks INSIDE the iframe (pause, seek, its own
// fullscreen), that frame gets transient activation and a popup can fire then.
// This kills the first-click popunder, which is the overwhelming majority.
// Layer 2 below catches the rest and demotes the offending source.
// ponytail: heuristic detection, upgrade only if providers change tactics.
// ---------------------------------------------------------------------------

type Props = {
  tmdbId: number;
  kind: "movie" | "tv";
  season?: number;
  episode?: number;
  /** Backdrop URL shown on the facade before playback starts. */
  poster?: string;
};

const PREFS_KEY = "moviely:playerPrefs";
const ADS_KEY = "moviely:sourcesWithAds";

// How long a source gets to return its document before we give up on it and
// try the next one. Generous enough for a slow phone, short enough that a dead
// source doesn't strand the user staring at a spinner.
const LOAD_BUDGET_MS = 8000;

type Prefs = { sourceId: string; preferHindi: boolean };

function loadPrefs(): Prefs {
  if (typeof window === "undefined") return { sourceId: SOURCES[0].id, preferHindi: false };
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { sourceId: SOURCES[0].id, preferHindi: false };
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return {
      sourceId: SOURCES.some((s) => s.id === parsed.sourceId) ? parsed.sourceId! : SOURCES[0].id,
      preferHindi: !!parsed.preferHindi,
    };
  } catch {
    return { sourceId: SOURCES[0].id, preferHindi: false };
  }
}

// Sources this browser has actually caught opening an ad tab. Self-correcting:
// beats a hand-maintained adFree flag that goes stale when a provider swaps
// ad partners.
function loadAdFlags(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ADS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

// Add a <link rel="preconnect"> once. Warms DNS + TLS so the iframe starts
// fetching video bytes the instant the user hits play.
function preconnect(href: string) {
  if (typeof document === "undefined" || !href) return;
  if (document.head.querySelector(`link[rel="preconnect"][href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "preconnect";
  link.href = href;
  link.crossOrigin = "";
  document.head.appendChild(link);
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
  const [preferHindi, setPreferHindi] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  // Iframe is not mounted until the user presses our play button. This is the
  // click-shield: their gesture lands in OUR document, never in the iframe.
  const [started, setStarted] = useState(false);
  const [adCaught, setAdCaught] = useState<string | null>(null);
  const [adFlags, setAdFlags] = useState<string[]>([]);
  // Sources we already gave up on for this title, so failover never loops.
  const [exhausted, setExhausted] = useState<string[]>([]);
  const [autoSwitched, setAutoSwitched] = useState<string | null>(null);
  // Click shield: a transparent layer over the iframe so no click ever reaches
  // it. Without a click the frame never gets transient activation, so it can
  // never call window.open() — the only airtight way to stop the pop-up.
  // Cost: the player's own controls are unreachable until unlocked.
  const [shielded, setShielded] = useState(true);
  const [shieldHint, setShieldHint] = useState(false);

  useEffect(() => {
    PLAYER_ORIGINS.forEach(preconnect);
    setAdFlags(loadAdFlags());

    const raw = typeof window !== "undefined" ? localStorage.getItem(PREFS_KEY) : null;
    const p = loadPrefs();
    setPreferHindi(p.preferHindi);
    // No stored choice + slow link → start on the lightest player.
    setSourceId(!raw && isSlowNetwork() ? "videasy" : p.sourceId);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ sourceId, preferHindi }));
    } catch {}
  }, [sourceId, preferHindi]);

  // --- Layer 2: catch a popup that got through -----------------------------
  // Events inside a cross-origin iframe never reach us, so we can't observe the
  // click directly. But focus moving INTO the iframe blurs our window — that's
  // our "user just clicked the player" signal. If the tab then goes hidden
  // within ~1.5s, a new tab was opened in front of us: an ad.
  // Alt-tabbing right after clicking the player can false-positive; we only
  // ever offer a switch, never act on our own.
  useEffect(() => {
    if (!started) return;
    let clickedIntoFrame = 0;
    const onBlur = () => {
      if (document.visibilityState === "visible") clickedIntoFrame = Date.now();
    };
    const onVisibility = () => {
      if (document.visibilityState !== "hidden") return;
      if (Date.now() - clickedIntoFrame > 1500) return;
      setAdCaught(sourceId);
      setAdFlags((prev) => {
        if (prev.includes(sourceId)) return prev;
        const next = [...prev, sourceId];
        try {
          localStorage.setItem(ADS_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    };
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [started, sourceId]);

  const src = useMemo(() => {
    const source = SOURCES.find((s) => s.id === sourceId) ?? SOURCES[0];
    // autoplay is what lets us skip the in-iframe click entirely.
    const opts = { preferHindi, autoplay: true };
    return kind === "movie"
      ? source.movie(tmdbId, opts)
      : source.tv(tmdbId, season ?? 1, episode ?? 1, opts);
  }, [sourceId, tmdbId, kind, season, episode, preferHindi]);

  const activeSource = SOURCES.find((s) => s.id === sourceId) ?? SOURCES[0];

  // Rank clean sources first; anything this browser caught popping an ad sinks.
  const rankedSources = useMemo(
    () =>
      [...SOURCES].sort((a, b) => {
        const score = (s: (typeof SOURCES)[number]) =>
          (adFlags.includes(s.id) ? 2 : 0) + (s.adFree ? 0 : 1);
        return score(a) - score(b);
      }),
    [adFlags],
  );

  // --- Auto-failover -------------------------------------------------------
  // We can't see inside the iframe, but we can see whether its document ever
  // loaded. If a source hasn't answered within the budget it's dead or too
  // slow — move to the next one automatically instead of leaving the user on a
  // spinner. Cleared the moment onLoad fires.
  // ponytail: only handles "never responded". A source that loads and then
  // shows its own "not found" screen can't be detected cross-origin — that's
  // what the manual "Try next source" button is for.
  useEffect(() => {
    if (!started || !loading) return;
    const timer = setTimeout(() => {
      const next = rankedSources.find(
        (s) => s.id !== sourceId && !exhausted.includes(s.id),
      );
      if (!next) return;
      setExhausted((prev) => [...prev, sourceId]);
      setAutoSwitched(next.name);
      setSourceId(next.id);
    }, LOAD_BUDGET_MS);
    return () => clearTimeout(timer);
  }, [started, loading, sourceId, exhausted, rankedSources]);

  // New title / episode → everything gets a fresh chance.
  useEffect(() => {
    setExhausted([]);
    setAutoSwitched(null);
    setStarted(false);
    setShielded(true);
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

  // Switching source from OUR button keeps the no-activation property, so the
  // new iframe is just as protected as the first one.
  const switchSource = (id: string) => {
    if (id === sourceId) return;
    setLoading(true);
    setAdCaught(null);
    setAutoSwitched(null);
    setSourceId(id);
    // A manual pick means the user vouches for it — clear the give-up list so
    // failover can still rescue them if this one also stalls.
    setExhausted([]);
  };

  // "Try next source" — what the user reaches for when a source loaded fine but
  // the video never actually plays (which we can't detect from out here).
  const tryNextSource = () => {
    const next = rankedSources.find(
      (s) => s.id !== sourceId && !exhausted.includes(s.id),
    );
    if (!next) {
      setExhausted([]);
      return;
    }
    setExhausted((prev) => [...prev, sourceId]);
    setLoading(true);
    setAdCaught(null);
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
          /* Facade — the click-shield. The user's gesture lands here, in our
             document, so the iframe below never gets transient activation. */
          <button
            type="button"
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
              <span className="max-w-[16rem] text-center text-[11px] leading-relaxed text-neutral-400">
                Starting from here blocks the pop-up ad most players fire on
                their first click.
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
            {/* Click shield — swallows every pointer event so the frame below
                never gains transient activation, and therefore can never open
                an ad tab. */}
            {shielded && (
              <div
                className="absolute inset-0 z-[15]"
                onClick={() => {
                  setShieldHint(true);
                  setTimeout(() => setShieldHint(false), 3200);
                }}
              >
                {shieldHint && (
                  <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-2 bg-black/85 p-3 backdrop-blur">
                    <span className="text-xs text-neutral-300">
                      Ad shield is on — the player&apos;s own controls are locked.
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShielded(false);
                        setShieldHint(false);
                      }}
                      className="rounded-md bg-white px-2.5 py-1 text-[11px] font-bold text-black transition hover:bg-neutral-200"
                    >
                      Unlock (may show ads)
                    </button>
                  </div>
                )}
              </div>
            )}
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

      {/* Ad caught — offer an escape hatch, don't yank playback ourselves. */}
      {adCaught && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
          <span className="text-amber-200">
            <strong>{SOURCES.find((s) => s.id === adCaught)?.name}</strong> just
            opened an ad tab. It&apos;s been demoted in the list below.
          </span>
          {rankedSources[0] && rankedSources[0].id !== adCaught && (
            <button
              type="button"
              onClick={() => switchSource(rankedSources[0].id)}
              className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-black transition hover:bg-amber-300"
            >
              Switch to {rankedSources[0].name}
            </button>
          )}
          <button
            type="button"
            onClick={() => setAdCaught(null)}
            className="ml-auto text-xs text-amber-200/60 hover:text-amber-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="mt-4 space-y-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
        {/* Ad shield + escape hatch for a source that loaded but won't play */}
        {started && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
              Ad Shield
            </span>
            <button
              type="button"
              onClick={() => setShielded((v) => !v)}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                shielded
                  ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40"
                  : "bg-white/5 text-neutral-400 ring-1 ring-white/10 hover:text-neutral-200"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  shielded ? "bg-emerald-400" : "bg-neutral-500"
                }`}
              />
              {shielded ? "On — no ads possible" : "Off — player controls live"}
            </button>
            <button
              type="button"
              onClick={tryNextSource}
              className="ml-auto rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-neutral-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              Not playing? Try next source
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
            Audio
          </span>
          <div className="grid grid-cols-2 gap-1 rounded-lg border border-white/10 bg-black/30 p-1">
            <button
              type="button"
              onClick={() => {
                setPreferHindi(false);
                setLoading(true);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                !preferHindi ? "bg-white text-black" : "text-neutral-300 hover:bg-white/5"
              }`}
            >
              Original
            </button>
            <button
              type="button"
              onClick={() => {
                setPreferHindi(true);
                setLoading(true);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                preferHindi
                  ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/25"
                  : "text-neutral-300 hover:bg-white/5"
              }`}
            >
              🇮🇳 Hindi Dubbed
            </button>
          </div>
          {preferHindi && !activeSource.hindiSupport && (
            <span className="text-[11px] text-amber-400">
              This source ignores Hindi preference. Switch to VidSrc CC or Embed.su below.
            </span>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
              Source
            </span>
            <span className="ml-auto flex items-center gap-1.5 text-[11px]">
              {adFlags.includes(activeSource.id) ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  <span className="text-red-400">Showed an ad here</span>
                </>
              ) : activeSource.adFree ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-emerald-400">Ad-Free</span>
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <span className="text-amber-400">May show ads</span>
                </>
              )}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {rankedSources.map((s) => {
              const active = s.id === sourceId;
              const flagged = adFlags.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onMouseEnter={() => preconnect(originOf(s))}
                  onTouchStart={() => preconnect(originOf(s))}
                  onClick={() => switchSource(s.id)}
                  title={
                    flagged
                      ? `${s.name} — opened an ad tab on this device`
                      : s.adFree
                        ? `${s.name} — ad-free${s.hindiSupport ? " · Hindi supported" : ""}`
                        : `${s.name} — may show ads`
                  }
                  className={`group flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/25"
                      : flagged
                        ? "border border-red-500/20 bg-red-500/5 text-neutral-500 hover:border-red-500/40 hover:text-neutral-300"
                        : "border border-white/10 bg-white/5 text-neutral-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {s.name}
                  {flagged && !active && <span className="text-[10px]">⚠</span>}
                  {!flagged && s.adFree && !active && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-label="Ad-free" />
                  )}
                  {!flagged && s.hindiSupport && !active && (
                    <span className="text-[10px]" aria-label="Hindi supported">🇮🇳</span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
            🟢 = ad-free · ⚠ = caught opening an ad on this device · 🇮🇳 = Hindi
            audio when the source has it. Every player auto-adapts{" "}
            <strong className="text-neutral-400">quality to your internet speed</strong>,
            and a stalled source is swapped out automatically. With{" "}
            <strong className="text-neutral-400">Ad Shield on</strong>, clicks can&apos;t
            reach the player, so it can never open an ad tab — use the{" "}
            <span className="rounded bg-white/10 px-1 text-neutral-300">⛶</span> button
            for fullscreen. Turn the shield off only if you need the player&apos;s own
            seek and pause. A browser cannot close a tab it didn&apos;t open, so ads
            have to be prevented rather than dismissed — for zero ads anywhere, install{" "}
            <a
              href="https://ublockorigin.com/"
              target="_blank"
              rel="noreferrer"
              className="text-red-400 underline decoration-red-400/40 underline-offset-2 hover:text-red-300"
            >
              uBlock Origin
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
