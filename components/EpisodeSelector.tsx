"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import PlayerFrame from "./PlayerFrame";
import { IMG } from "@/lib/tmdb";

type SeasonSummary = {
  season_number: number;
  name: string;
  episode_count: number;
};

type Episode = {
  episode_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string;
  runtime: number | null;
  vote_average?: number;
};

export default function EpisodeSelector({
  tmdbId,
  seasons,
}: {
  tmdbId: number;
  seasons: SeasonSummary[];
}) {
  const playable = seasons.filter((s) => s.season_number > 0);
  const [season, setSeason] = useState<number>(playable[0]?.season_number ?? 1);
  const [episode, setEpisode] = useState<number>(1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/season?tv=${tmdbId}&season=${season}`);
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { episodes: Episode[] };
        if (!cancelled) {
          setEpisodes(data.episodes ?? []);
          setEpisode(1);
        }
      } catch {
        if (!cancelled) setEpisodes([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [tmdbId, season]);

  const currentEp = episodes.find((e) => e.episode_number === episode);

  return (
    <div className="flex flex-col gap-6">
      <PlayerFrame tmdbId={tmdbId} kind="tv" season={season} episode={episode} />

      {currentEp && (
        <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-red-400">
            Now Playing
          </p>
          <h4 className="mt-1 text-lg font-bold text-white">
            S{season} · E{currentEp.episode_number} — {currentEp.name}
          </h4>
          {currentEp.overview && (
            <p className="mt-2 text-sm text-neutral-300 line-clamp-3">{currentEp.overview}</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
          Season
        </label>
        <div className="relative">
          <select
            value={season}
            onChange={(e) => setSeason(Number(e.target.value))}
            className="cursor-pointer appearance-none rounded-lg border border-white/10 bg-black/40 py-2 pl-3 pr-9 text-sm font-medium text-white transition hover:border-white/25 focus:border-red-500/60 focus:outline-none"
          >
            {playable.map((s) => (
              <option key={s.season_number} value={s.season_number} className="bg-neutral-900">
                {s.name} · {s.episode_count} eps
              </option>
            ))}
          </select>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="ml-auto text-xs text-neutral-500">
          {episodes.length} episode{episodes.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div>
        <div className="grid gap-3">
          {loading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex animate-pulse gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-3"
              >
                <div className="aspect-video w-56 shrink-0 rounded-lg bg-neutral-900" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 w-2/3 rounded bg-neutral-900" />
                  <div className="h-3 w-full rounded bg-neutral-900" />
                  <div className="h-3 w-5/6 rounded bg-neutral-900" />
                </div>
              </div>
            ))}
          {!loading &&
            episodes.map((ep) => {
              const active = ep.episode_number === episode;
              const still = ep.still_path ? `${IMG}/w300${ep.still_path}` : null;
              return (
                <button
                  key={ep.episode_number}
                  type="button"
                  onClick={() => {
                    setEpisode(ep.episode_number);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`group flex gap-3 rounded-xl border p-2.5 text-left transition sm:gap-4 sm:p-3 ${
                    active
                      ? "border-red-500/60 bg-red-500/[0.08] ring-1 ring-red-500/40"
                      : "border-white/5 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                  }`}
                >
                  {/* LEFT: still image with episode number + play overlay */}
                  <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg bg-neutral-900 sm:w-56">
                    {still ? (
                      <Image
                        src={still}
                        alt={ep.name}
                        fill
                        sizes="(max-width: 640px) 112px, 224px"
                        className="object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-xs text-neutral-500">
                        No image
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <span className="absolute left-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                      EP {String(ep.episode_number).padStart(2, "0")}
                    </span>
                    <div
                      className={`absolute inset-0 grid place-items-center transition ${
                        active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <span className="grid h-11 w-11 place-items-center rounded-full bg-white/95 text-black shadow-xl">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </span>
                    </div>
                  </div>
                  {/* RIGHT: text */}
                  <div className="min-w-0 flex-1 py-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="line-clamp-1 text-sm font-bold text-white sm:text-base">
                        {ep.name || `Episode ${ep.episode_number}`}
                      </h4>
                      {typeof ep.vote_average === "number" && ep.vote_average > 0 && (
                        <span className="shrink-0 text-xs font-semibold text-yellow-400">
                          ★ {ep.vote_average.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-neutral-500">
                      {ep.air_date && <span>{ep.air_date}</span>}
                      {ep.runtime ? <span>· {ep.runtime} min</span> : null}
                      {active && (
                        <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-300">
                          Playing
                        </span>
                      )}
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-neutral-400 sm:text-sm sm:line-clamp-3">
                      {ep.overview || "No description available."}
                    </p>
                  </div>
                </button>
              );
            })}
          {!loading && episodes.length === 0 && (
            <p className="text-sm text-neutral-500">No episodes available for this season.</p>
          )}
        </div>
      </div>
    </div>
  );
}
