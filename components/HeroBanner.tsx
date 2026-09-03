"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { backdropUrl, type MediaItem } from "@/lib/tmdb";

export default function HeroBanner({ item }: { item: MediaItem }) {
  const bg = backdropUrl(item.backdrop_path, "original");
  const year = item.release_date?.slice(0, 4) ?? "";
  const href = `/${item.media_type}/${item.id}`;

  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/preview?type=${item.media_type}&id=${item.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { trailerKey: string | null } | null) => {
        if (cancelled || !data?.trailerKey) return;
        setTrailerKey(data.trailerKey);
        // Give the hero image a beat to render, then swap.
        setTimeout(() => !cancelled && setShowTrailer(true), 1500);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [item.media_type, item.id]);

  const trailerSrc = trailerKey
    ? `https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&mute=${
        muted ? 1 : 0
      }&controls=0&rel=0&modestbranding=1&playsinline=1&loop=1&playlist=${trailerKey}&disablekb=1&iv_load_policy=3`
    : null;

  return (
    <section className="relative h-[85vh] min-h-[560px] w-full overflow-hidden">
      {/* Backdrop image — always rendered, fades under the trailer */}
      {bg && (
        <Image
          src={bg}
          alt={item.title}
          fill
          priority
          sizes="100vw"
          className={`object-cover transition-opacity duration-1000 ${
            showTrailer && trailerSrc ? "opacity-0" : "opacity-100"
          }`}
        />
      )}
      {/* Autoplay muted trailer */}
      {showTrailer && trailerSrc && (
        <div className="absolute inset-0 overflow-hidden">
          <iframe
            src={trailerSrc}
            title={`${item.title} trailer`}
            allow="autoplay; encrypted-media"
            className="pointer-events-none absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.77vh] min-w-full -translate-x-1/2 -translate-y-1/2"
            frameBorder={0}
          />
        </div>
      )}
      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex h-full max-w-[1600px] flex-col justify-end px-4 pb-16 sm:px-8 sm:pb-20">
        <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-red-300 backdrop-blur">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
          {item.media_type === "tv" ? "Featured Series" : "Featured Movie"}
        </span>
        <h1 className="max-w-2xl text-4xl font-black leading-[1.05] text-white drop-shadow-2xl sm:text-6xl md:text-7xl">
          {item.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-300">
          {item.vote_average > 0 && (
            <span className="flex items-center gap-1 font-semibold text-yellow-400">
              ★ {item.vote_average.toFixed(1)}
            </span>
          )}
          {year && <span>{year}</span>}
          <span className="rounded border border-neutral-500 px-1.5 text-[11px] font-semibold text-neutral-300">
            HD
          </span>
        </div>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-neutral-200 drop-shadow sm:text-base line-clamp-3">
          {item.overview}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={href}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3 text-base font-bold text-black shadow-xl transition hover:bg-neutral-200"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
            Play
          </Link>
          <Link
            href={href}
            className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-7 py-3 text-base font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
            </svg>
            More Info
          </Link>
          {trailerKey && showTrailer && (
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? "Unmute trailer" : "Mute trailer"}
              className="ml-auto grid h-11 w-11 place-items-center rounded-full border border-white/30 bg-black/40 text-white backdrop-blur transition hover:bg-black/70"
            >
              {muted ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M11 5 6 9H2v6h4l5 4V5Z" strokeLinejoin="round" />
                  <path d="m22 9-6 6M16 9l6 6" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M11 5 6 9H2v6h4l5 4V5Z" strokeLinejoin="round" />
                  <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" strokeLinecap="round" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
