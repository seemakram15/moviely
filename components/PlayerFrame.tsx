"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SOURCES } from "@/lib/players";

type Props = {
  tmdbId: number;
  kind: "movie" | "tv";
  season?: number;
  episode?: number;
};

const PREFS_KEY = "moviely:playerPrefs";

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

export default function PlayerFrame({ tmdbId, kind, season, episode }: Props) {
  // Start with the default so SSR/CSR match — hydrate stored prefs after mount.
  const [sourceId, setSourceId] = useState<string>(SOURCES[0].id);
  const [preferHindi, setPreferHindi] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const p = loadPrefs();
    setSourceId(p.sourceId);
    setPreferHindi(p.preferHindi);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ sourceId, preferHindi }));
    } catch {}
  }, [sourceId, preferHindi]);

  const src = useMemo(() => {
    const source = SOURCES.find((s) => s.id === sourceId) ?? SOURCES[0];
    const opts = { preferHindi };
    return kind === "movie"
      ? source.movie(tmdbId, opts)
      : source.tv(tmdbId, season ?? 1, episode ?? 1, opts);
  }, [sourceId, tmdbId, kind, season, episode, preferHindi]);

  const activeSource = SOURCES.find((s) => s.id === sourceId) ?? SOURCES[0];
  const wrapperRef = useRef<HTMLDivElement>(null);

  const goFullscreen = () => {
    const el = wrapperRef.current;
    if (!el) return;
    // Vendor prefixes cover Safari — the fullscreen API isn't standardised
    // enough to skip these.
    type FSElement = HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
      msRequestFullscreen?: () => Promise<void>;
    };
    const e = el as FSElement;
    const req = e.requestFullscreen ?? e.webkitRequestFullscreen ?? e.msRequestFullscreen;
    req?.call(e).catch(() => {});
  };

  return (
    <div className="w-full">
      {/* Player wrapper — aspect-video on desktop, min-height on mobile so
          the embed's built-in settings popup has room to breathe (we can't
          restyle inside a cross-origin iframe). */}
      <div
        ref={wrapperRef}
        className="group/player relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-black shadow-2xl shadow-black/60 ring-1 ring-white/10 transition hover:ring-white/20 sm:aspect-video"
      >
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
          onLoad={() => setLoading(false)}
          className="absolute inset-0 h-full w-full"
        />
        {/* Mobile-only fullscreen button — sits above the iframe so it always
            works, even when the embedded UI is covering the whole video. */}
        <button
          type="button"
          onClick={goFullscreen}
          aria-label="Enter fullscreen"
          className="absolute right-2 top-2 z-20 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur transition hover:border-white/50 hover:bg-black/80 sm:hidden"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Controls */}
      <div className="mt-4 space-y-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
        {/* Audio preference */}
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
                !preferHindi
                  ? "bg-white text-black"
                  : "text-neutral-300 hover:bg-white/5"
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

        {/* Source picker */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
              Source
            </span>
            <span className="ml-auto flex items-center gap-1.5 text-[11px]">
              {activeSource.adFree ? (
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
            {SOURCES.map((s) => {
              const active = s.id === sourceId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    if (s.id !== sourceId) {
                      setLoading(true);
                      setSourceId(s.id);
                    }
                  }}
                  title={
                    s.adFree
                      ? `${s.name} — ad-free${s.hindiSupport ? " · Hindi supported" : ""}`
                      : `${s.name} — may show ads`
                  }
                  className={`group flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/25"
                      : "border border-white/10 bg-white/5 text-neutral-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {s.name}
                  {s.adFree && !active && (
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                      aria-label="Ad-free"
                    />
                  )}
                  {s.hindiSupport && !active && (
                    <span className="text-[10px]" aria-label="Hindi supported">🇮🇳</span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
            🟢 = ad-free · 🇮🇳 = Hindi audio when source has it · Built-in
            <strong className="text-neutral-400"> speed, volume, quality &amp; PIP </strong>
            in every player. On mobile, tap <span className="rounded bg-white/10 px-1 text-neutral-300">⛶</span> to go fullscreen for a better popup layout. For
            ad-free anywhere, install{" "}
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
