"use client";

import { useEffect, useState } from "react";
import { isInWatchlist, toggleWatchlist, type WatchlistItem } from "@/lib/userStore";

type Props = Omit<WatchlistItem, "addedAt"> & {
  size?: "sm" | "md";
  className?: string;
};

export default function WatchlistButton({ tmdbId, kind, title, poster, size = "md", className = "" }: Props) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isInWatchlist(tmdbId));
  }, [tmdbId]);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleWatchlist({ tmdbId, kind, title, poster });
    setSaved(next);
  };

  const dim = size === "sm" ? "h-7 w-7" : "h-10 w-10";
  const icon = size === "sm" ? 14 : 16;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={saved ? `Remove ${title} from watchlist` : `Add ${title} to watchlist`}
      title={saved ? "Remove from watchlist" : "Add to watchlist"}
      className={`grid place-items-center rounded-full border backdrop-blur transition ${dim} ${
        saved
          ? "border-red-500/60 bg-red-500/20 text-red-400 hover:bg-red-500/30"
          : "border-white/25 bg-black/50 text-white hover:border-white/50 hover:bg-black/70"
      } ${className}`}
    >
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
