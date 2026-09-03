"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { posterUrl, backdropUrl, type MediaItem } from "@/lib/tmdb";

type PreviewPayload = {
  trailerKey: string | null;
  runtime?: number | null;
  seasons?: number;
  episodes?: number;
  tagline?: string;
  genres?: string[];
};

export default function MediaCard({
  item,
  fluid = false,
}: {
  item: MediaItem;
  /** true = fill parent cell (grids); false = fixed width (horizontal rails). */
  fluid?: boolean;
}) {
  const href = `/${item.media_type}/${item.id}`;
  const year = item.release_date?.slice(0, 4) ?? "";
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
  const poster = posterUrl(item.poster_path, "w342");
  const backdrop = backdropUrl(item.backdrop_path, "w780");

  const [hover, setHover] = useState(false);
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trailerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestedRef = useRef(false);

  const clearTimers = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    if (trailerTimer.current) clearTimeout(trailerTimer.current);
    hoverTimer.current = null;
    trailerTimer.current = null;
  };

  const onEnter = () => {
    // Netflix uses ~500ms delay to avoid firing during quick sweeps.
    hoverTimer.current = setTimeout(() => {
      setHover(true);
      if (!requestedRef.current) {
        requestedRef.current = true;
        fetch(`/api/preview?type=${item.media_type}&id=${item.id}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => data && setPreview(data as PreviewPayload))
          .catch(() => {});
      }
      // Give the panel a moment to appear before the trailer swaps in.
      trailerTimer.current = setTimeout(() => setShowTrailer(true), 700);
    }, 450);
  };

  const onLeave = () => {
    clearTimers();
    setHover(false);
    setShowTrailer(false);
  };

  useEffect(() => () => clearTimers(), []);

  return (
    <div
      className={`group relative ${
        fluid ? "w-full" : "w-[128px] shrink-0 sm:w-[160px] md:w-[200px]"
      }`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <Link href={href} aria-label={item.title} className="block">
        <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-neutral-800 ring-1 ring-white/5 transition duration-300 group-hover:ring-white/20">
          {poster ? (
            <Image
              src={poster}
              alt={item.title}
              fill
              sizes="(max-width: 640px) 128px, (max-width: 768px) 160px, 200px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-neutral-500">
              No image
            </div>
          )}
          {rating && (
            <div className="absolute right-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-yellow-400 backdrop-blur">
              ★ {rating}
            </div>
          )}
        </div>
        <div className="mt-2 px-0.5">
          <h3 className="line-clamp-1 text-sm font-medium text-white">{item.title}</h3>
          <p className="text-xs text-neutral-500">{year}</p>
        </div>
      </Link>

      {/* Netflix-style hover preview — floats above neighbors */}
      <div
        className={`pointer-events-none absolute left-1/2 top-0 z-30 hidden -translate-x-1/2 md:block ${
          hover ? "opacity-100" : "opacity-0"
        } transition-all duration-200`}
        style={{
          width: 420,
          transform: hover
            ? "translate(-50%, -8%) scale(1)"
            : "translate(-50%, 0%) scale(0.9)",
        }}
      >
        {hover && (
          <div className="pointer-events-auto overflow-hidden rounded-xl bg-neutral-900 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.9)] ring-1 ring-white/10">
            <div className="relative aspect-video w-full bg-neutral-800">
              {showTrailer && preview?.trailerKey ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${preview.trailerKey}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&playsinline=1&loop=1&playlist=${preview.trailerKey}`}
                  title={`${item.title} trailer`}
                  allow="autoplay; encrypted-media"
                  className="absolute inset-0 h-full w-full"
                  frameBorder={0}
                />
              ) : backdrop ? (
                <Image src={backdrop} alt="" fill sizes="340px" className="object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-xs text-neutral-500">
                  Loading preview…
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/10 to-transparent" />
            </div>
            <div className="p-3">
              <div className="flex items-center gap-2">
                <Link
                  href={href}
                  className="grid h-9 w-9 place-items-center rounded-full bg-white text-black transition hover:bg-neutral-200"
                  aria-label={`Play ${item.title}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </Link>
                <Link
                  href={href}
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/40 text-white transition hover:border-white"
                  aria-label={`More info on ${item.title}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                </Link>
                {rating && (
                  <span className="ml-auto text-xs font-semibold text-yellow-400">
                    ★ {rating}
                  </span>
                )}
              </div>
              <h4 className="mt-3 line-clamp-1 text-base font-bold text-white">{item.title}</h4>
              {preview?.tagline && (
                <p className="line-clamp-1 text-[11px] italic text-neutral-500">
                  &ldquo;{preview.tagline}&rdquo;
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-neutral-400">
                <span className="rounded-sm border border-neutral-600 px-1 py-px text-neutral-300">
                  {item.media_type === "tv" ? "TV" : "MOVIE"}
                </span>
                {year && <span>{year}</span>}
                {typeof preview?.runtime === "number" && preview.runtime > 0 && (
                  <span>· {preview.runtime} min</span>
                )}
                {typeof preview?.seasons === "number" && preview.seasons > 0 && (
                  <span>· {preview.seasons} season{preview.seasons > 1 ? "s" : ""}</span>
                )}
                {typeof preview?.episodes === "number" && preview.episodes > 0 && (
                  <span>· {preview.episodes} eps</span>
                )}
                <span className="ml-1 rounded border border-neutral-600 px-1 text-[10px] font-semibold text-neutral-300">HD</span>
              </div>
              {preview?.genres && preview.genres.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {preview.genres.slice(0, 4).map((g) => (
                    <span
                      key={g}
                      className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-neutral-300"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-3 line-clamp-4 text-xs leading-relaxed text-neutral-300">
                {item.overview || "No description available."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
