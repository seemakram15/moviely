"use client";

import { useEffect } from "react";

export default function TrailerModal({
  open,
  onClose,
  trailerKey,
  title,
}: {
  open: boolean;
  onClose: () => void;
  trailerKey: string | null;
  title: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const src = trailerKey
    ? `https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1&playsinline=1`
    : null;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} trailer`}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close trailer"
        className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/60 text-white transition hover:border-white/40 hover:bg-white/10"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
          <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
        </svg>
      </button>
      <div
        className="relative w-full max-w-5xl px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-400">
          Trailer
        </p>
        <h3 className="mb-4 text-2xl font-black text-white sm:text-3xl">{title}</h3>
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10">
          {src ? (
            <iframe
              src={src}
              title={`${title} trailer`}
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
              frameBorder={0}
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-neutral-400">
              No trailer available.
            </div>
          )}
        </div>
        <p className="mt-3 text-center text-xs text-neutral-500">
          Press <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5">Esc</kbd> or click outside to close.
        </p>
      </div>
    </div>
  );
}
