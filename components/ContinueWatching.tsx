"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getWatchHistory, removeFromHistory, type WatchHistoryItem } from "@/lib/userStore";

export default function ContinueWatching() {
  const [items, setItems] = useState<WatchHistoryItem[]>([]);

  useEffect(() => {
    setItems(getWatchHistory());
  }, []);

  if (items.length === 0) return null;

  const remove = (tmdbId: number) => {
    removeFromHistory(tmdbId);
    setItems((prev) => prev.filter((i) => i.tmdbId !== tmdbId));
  };

  return (
    <section className="mx-auto max-w-[1600px] px-4 pt-6 sm:px-8">
      <div className="mb-3 flex items-center gap-3">
        <span className="h-7 w-1 rounded-full bg-gradient-to-b from-red-500 to-orange-500" />
        <h2 className="text-lg font-bold text-white">Continue Watching</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <div key={item.tmdbId} className="group relative shrink-0 w-[140px] sm:w-[170px]">
            <Link href={`/${item.kind}/${item.tmdbId}`} className="block">
              <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-neutral-800 ring-1 ring-white/5 transition group-hover:ring-white/20">
                {item.poster ? (
                  <Image
                    src={item.poster}
                    alt={item.title}
                    fill
                    sizes="170px"
                    className="object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-xs text-neutral-500">
                    No image
                  </div>
                )}
                {/* Play overlay */}
                <div className="absolute inset-0 grid place-items-center bg-black/50 opacity-0 transition group-hover:opacity-100">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-white/90 text-black">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </div>
                {/* Resume bar — always 100% width, just a visual "was watching" hint */}
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-red-500/70" />
              </div>
              <p className="mt-1.5 line-clamp-1 text-xs font-medium text-neutral-200">{item.title}</p>
              <p className="text-[10px] text-neutral-500 capitalize">{item.kind}</p>
            </Link>
            {/* Remove button */}
            <button
              type="button"
              onClick={() => remove(item.tmdbId)}
              aria-label={`Remove ${item.title} from continue watching`}
              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/80 text-neutral-300 opacity-0 ring-1 ring-white/10 transition hover:text-white group-hover:opacity-100"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
