"use client";

import { useMemo, useState } from "react";
import { SOURCES } from "@/lib/players";

type Props = {
  tmdbId: number;
  kind: "movie" | "tv";
  season?: number;
  episode?: number;
};

// Icons per source — purely decorative.
const SOURCE_ICON: Record<string, string> = {
  vidking: "👑",
  vidsrc: "🎬",
  "2embed": "🎞️",
  autoembed: "⚡",
};

export default function PlayerFrame({ tmdbId, kind, season, episode }: Props) {
  const [sourceId, setSourceId] = useState<string>(SOURCES[0].id);
  const [loading, setLoading] = useState(true);

  const src = useMemo(() => {
    const source = SOURCES.find((s) => s.id === sourceId) ?? SOURCES[0];
    return kind === "movie"
      ? source.movie(tmdbId)
      : source.tv(tmdbId, season ?? 1, episode ?? 1);
  }, [sourceId, tmdbId, kind, season, episode]);

  return (
    <div className="w-full">
      <div className="group/player relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl shadow-black/60 ring-1 ring-white/10 transition hover:ring-white/20">
        {loading && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-neutral-950">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-red-500" />
              <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                Loading player…
              </p>
            </div>
          </div>
        )}
        {/* Note: several free embed players (VidKing included) refuse to run
            inside a sandboxed iframe, so we don't sandbox. Popup-ad protection
            comes from the browser's popup blocker + any ad-blocker extension
            (uBlock Origin recommended). */}
        <iframe
          key={src}
          src={src}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="no-referrer"
          onLoad={() => setLoading(false)}
          className="absolute inset-0 h-full w-full"
        />
      </div>

      <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.03] p-3">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
            Source
          </span>
          <span className="ml-auto flex items-center gap-1.5 text-[11px] text-neutral-400">
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-500" />
            Third-party player
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
                className={`group flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/25"
                    : "border border-white/10 bg-white/5 text-neutral-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span aria-hidden>{SOURCE_ICON[s.id] ?? "▶"}</span>
                {s.name}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-neutral-500">
          For an ad-free experience, install{" "}
          <a
            href="https://ublockorigin.com/"
            target="_blank"
            rel="noreferrer"
            className="text-red-400 underline decoration-red-400/40 underline-offset-2 hover:text-red-300"
          >
            uBlock Origin
          </a>{" "}
          — free browser extension. If a player fails, switch source above.
        </p>
      </div>
    </div>
  );
}
