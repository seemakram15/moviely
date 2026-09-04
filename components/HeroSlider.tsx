"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { backdropUrl, type MediaItem } from "@/lib/tmdb";

const AUTOPLAY_MS = 7000;

export default function HeroSlider({ items }: { items: MediaItem[] }) {
  const slides = items.slice(0, 6);
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback(
    (next: number) => {
      const n = ((next % slides.length) + slides.length) % slides.length;
      setIndex(n);
    },
    [slides.length]
  );

  useEffect(() => {
    if (slides.length <= 1) return;
    timerRef.current = setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      AUTOPLAY_MS
    );
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slides.length]);

  const current = slides[index];
  if (!current) return null;

  const year = current.release_date?.slice(0, 4) ?? "";
  const href = `/${current.media_type}/${current.id}`;

  return (
    <section className="relative h-[calc(100svh-3.5rem)] min-h-[440px] w-full overflow-hidden sm:h-[85dvh] sm:min-h-[560px]">
      {/* Slides — pure backdrop imagery, no trailers */}
      {slides.map((s, i) => {
        const bg = backdropUrl(s.backdrop_path, "original");
        return (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={i !== index}
          >
            {bg && (
              <Image
                src={bg}
                alt={s.title}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
              />
            )}
          </div>
        );
      })}

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex h-full max-w-[1600px] flex-col justify-end px-4 pb-16 pt-20 sm:px-8 sm:pb-28 sm:pt-32">
        <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-red-300 backdrop-blur">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
          #{index + 1} Featured · {current.media_type === "tv" ? "Series" : "Movie"}
        </span>
        <h1
          key={current.id + "-title"}
          className="max-w-2xl text-[clamp(1.6rem,7vw,2.5rem)] font-black leading-[1.05] text-white drop-shadow-2xl sm:text-6xl md:text-7xl animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          {current.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-300">
          {current.vote_average > 0 && (
            <span className="flex items-center gap-1 font-semibold text-yellow-400">
              ★ {current.vote_average.toFixed(1)}
            </span>
          )}
          {year && <span>{year}</span>}
          <span className="rounded border border-neutral-500 px-1.5 text-[11px] font-semibold text-neutral-300">HD</span>
        </div>
        <p className="mt-4 max-w-xl text-xs leading-relaxed text-neutral-200 drop-shadow line-clamp-2 sm:mt-5 sm:text-base sm:line-clamp-3">
          {current.overview}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-2 sm:mt-8 sm:gap-3">
          <Link
            href={href}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-bold text-black shadow-xl transition hover:bg-neutral-200 sm:flex-none sm:px-7 sm:text-base"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
            Play
          </Link>
          <Link
            href={href}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 sm:flex-none sm:px-7 sm:text-base"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
            </svg>
            More Info
          </Link>
        </div>
      </div>

      {/* Prev / next arrows */}
      <button
        type="button"
        onClick={() => goTo(index - 1)}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-white/15 bg-black/50 p-3 text-white backdrop-blur transition hover:border-white/40 hover:bg-black/80 md:block"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
          <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => goTo(index + 1)}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-white/15 bg-black/50 p-3 text-white backdrop-blur transition hover:border-white/40 hover:bg-black/80 md:block"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
          <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => goTo(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-8 bg-red-500" : "w-2 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
