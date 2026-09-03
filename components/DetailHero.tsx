"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { backdropUrl, posterUrl, type MediaType } from "@/lib/tmdb";
import TrailerModal from "./TrailerModal";

type Genre = { id: number; name: string };

type Props = {
  id: number;
  mediaType: MediaType;
  title: string;
  tagline?: string;
  overview: string;
  backdropPath: string | null;
  posterPath: string | null;
  rating: number;
  year: string;
  runtime?: number | null;
  seasons?: number;
  episodes?: number;
  genres: Genre[];
  status?: string;
};

export default function DetailHero({
  id,
  mediaType,
  title,
  tagline,
  overview,
  backdropPath,
  posterPath,
  rating,
  year,
  runtime,
  seasons,
  episodes,
  genres,
  status,
}: Props) {
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [muted, setMuted] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/preview?type=${mediaType}&id=${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { trailerKey: string | null } | null) => {
        if (cancelled || !data?.trailerKey) return;
        setTrailerKey(data.trailerKey);
        setTimeout(() => !cancelled && setShowTrailer(true), 1500);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [mediaType, id]);

  const trailerSrc = trailerKey
    ? `https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&mute=${
        muted ? 1 : 0
      }&controls=0&rel=0&modestbranding=1&playsinline=1&loop=1&playlist=${trailerKey}&disablekb=1&iv_load_policy=3`
    : null;

  const bg = backdropUrl(backdropPath, "original");
  const poster = posterUrl(posterPath, "w500");

  const scrollToPlayer = () => {
    const el = document.getElementById("watch");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative min-h-[85vh] w-full overflow-hidden sm:min-h-[90vh]">
      {/* Background: backdrop → fades under trailer */}
      {bg && (
        <Image
          src={bg}
          alt={title}
          fill
          priority
          sizes="100vw"
          className={`object-cover transition-opacity duration-1000 ${
            showTrailer && trailerSrc ? "opacity-0" : "opacity-100"
          }`}
        />
      )}
      {showTrailer && trailerSrc && (
        <div className="absolute inset-0 overflow-hidden">
          <iframe
            src={trailerSrc}
            title={`${title} trailer`}
            allow="autoplay; encrypted-media"
            className="pointer-events-none absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.77vh] min-w-full -translate-x-1/2 -translate-y-1/2 scale-110"
            frameBorder={0}
          />
        </div>
      )}
      {/* Gradients — strong bottom + left, subtle right */}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/60 to-transparent" />

      {/* Content grid */}
      <div className="relative z-10 mx-auto flex min-h-[85vh] max-w-[1600px] items-end px-4 pb-10 pt-24 sm:min-h-[90vh] sm:px-8 sm:pb-20 sm:pt-32">
        <div className="grid w-full grid-cols-[110px_1fr] items-end gap-4 sm:grid-cols-[180px_1fr] sm:gap-8 md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] lg:gap-12">
          {/* Poster — always visible, scales down on mobile */}
          <div>
            {poster && (
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg shadow-2xl shadow-black/70 ring-1 ring-white/10 sm:rounded-2xl">
                <Image
                  src={poster}
                  alt={title}
                  fill
                  sizes="(max-width: 640px) 110px, (max-width: 1024px) 220px, 280px"
                  className="object-cover"
                  priority
                />
              </div>
            )}
          </div>

          {/* Text */}
          <div className="max-w-3xl">
            <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-red-300 backdrop-blur sm:mb-4 sm:px-3 sm:py-1 sm:text-[11px]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
              {mediaType === "tv" ? "TV Series" : "Movie"}
              {status && status !== "Released" && status !== "Ended" && (
                <span className="text-neutral-400"> · {status}</span>
              )}
            </span>
            <h1 className="text-2xl font-black leading-[1.05] tracking-tight text-white drop-shadow-2xl sm:text-5xl lg:text-7xl">
              {title}
            </h1>
            {tagline && (
              <p className="mt-2 text-sm italic text-neutral-300 drop-shadow sm:mt-3 sm:text-lg">
                &ldquo;{tagline}&rdquo;
              </p>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {rating > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-yellow-400/10 px-3 py-1 font-semibold text-yellow-400 ring-1 ring-yellow-400/20">
                  ★ {rating.toFixed(1)}
                </span>
              )}
              {year && <span className="text-neutral-300">{year}</span>}
              {runtime ? <span className="text-neutral-400">· {runtime} min</span> : null}
              {typeof seasons === "number" && seasons > 0 && (
                <span className="text-neutral-400">
                  · {seasons} season{seasons > 1 ? "s" : ""}
                </span>
              )}
              {typeof episodes === "number" && episodes > 0 && (
                <span className="text-neutral-400">· {episodes} eps</span>
              )}
              <span className="rounded border border-neutral-400 px-1.5 py-0.5 text-[11px] font-bold text-neutral-200">
                HD
              </span>
            </div>
            {genres.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {genres.map((g) => (
                  <span
                    key={g.id}
                    className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-neutral-200 backdrop-blur"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-200/95 drop-shadow line-clamp-3 sm:mt-6 sm:text-base sm:line-clamp-4">
              {overview}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2 sm:mt-8 sm:gap-3">
              <button
                type="button"
                onClick={scrollToPlayer}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-black shadow-xl transition hover:bg-neutral-200 sm:flex-none sm:px-7 sm:py-3 sm:text-base"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Play {mediaType === "tv" ? "Episode" : "Movie"}
              </button>
              {trailerKey && (
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 sm:flex-none sm:px-5 sm:py-3"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <path d="M10 9v6l5-3z" fill="currentColor" />
                  </svg>
                  Watch Trailer
                </button>
              )}
              {trailerKey && showTrailer && (
                <button
                  type="button"
                  onClick={() => setMuted((m) => !m)}
                  aria-label={muted ? "Unmute background trailer" : "Mute background trailer"}
                  className="grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
                >
                  {muted ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M11 5 6 9H2v6h4l5 4V5Z" strokeLinejoin="round" />
                      <path d="m22 9-6 6M16 9l6 6" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M11 5 6 9H2v6h4l5 4V5Z" strokeLinejoin="round" />
                      <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <TrailerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        trailerKey={trailerKey}
        title={title}
      />

      {/* Scroll cue */}
      <button
        type="button"
        onClick={scrollToPlayer}
        aria-label="Scroll to player"
        className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-black/40 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-neutral-300 backdrop-blur transition hover:border-white/30 hover:text-white sm:inline-flex"
      >
        Watch Now
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true" className="animate-bounce">
          <path d="M12 5v14m0 0-6-6m6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </section>
  );
}
