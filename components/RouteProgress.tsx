"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

/**
 * A YouTube/GitHub-style top progress bar with an animated % counter.
 * Starts on any internal <a href="/...">/<Link> click, animates 0 → 90 % on a
 * randomised curve, and snaps to 100 % when the new route's pathname or search
 * params change. Purely client-side — no navigation events needed.
 */
export default function RouteProgress() {
  return (
    <Suspense fallback={null}>
      <RouteProgressInner />
    </Suspense>
  );
}

function RouteProgressInner() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const armedKeyRef = useRef<string>(pathname + "?" + search.toString());

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const start = () => {
    stop();
    setVisible(true);
    setProgress(8);
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return p; // hold at 90 until real navigation completes
        // Ease-out: bigger jumps early, tiny at the end
        const step = Math.max(0.5, (95 - p) * 0.08 + Math.random() * 2);
        return Math.min(90, p + step);
      });
    }, 120);
  };

  const complete = () => {
    stop();
    setProgress(100);
    // Give the eye a beat, then reset for the next navigation.
    setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 350);
  };

  // Watch for clicks on internal links → arm the bar.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const el = (e.target as HTMLElement | null)?.closest("a");
      if (!el) return;
      const href = el.getAttribute("href");
      if (!href || href.startsWith("#") || el.target === "_blank" || el.hasAttribute("download")) return;
      // Only internal navigations.
      if (!href.startsWith("/") && !href.startsWith(window.location.origin)) return;
      // Skip if we're already on that exact URL.
      const url = new URL(href, window.location.origin);
      if (url.pathname + url.search === window.location.pathname + window.location.search) return;
      start();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Also start when the router pushes programmatically (back button, form submit).
  useEffect(() => {
    const onPop = () => start();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Complete on any real route change.
  useEffect(() => {
    const key = pathname + "?" + search.toString();
    if (key !== armedKeyRef.current) {
      armedKeyRef.current = key;
      complete();
    }
  }, [pathname, search]);

  useEffect(() => stop, []);

  const pct = Math.round(progress);

  return (
    <>
      {/* Top progress bar */}
      <div
        className={`pointer-events-none fixed inset-x-0 top-0 z-[200] h-[3px] transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      >
        <div
          className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)] transition-[width] duration-200 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Floating % chip — bottom-right, subtle */}
      <div
        className={`pointer-events-none fixed bottom-5 right-5 z-[200] flex items-center gap-2 rounded-full border border-white/10 bg-black/70 px-3 py-1.5 text-xs font-semibold text-white shadow-2xl backdrop-blur transition-all duration-200 ${
          visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
        aria-live="polite"
        role="status"
      >
        <span className="grid h-4 w-4 place-items-center">
          <span className="h-2 w-2 animate-ping rounded-full bg-red-400" />
          <span className="absolute h-2 w-2 rounded-full bg-red-500" />
        </span>
        <span className="tabular-nums">{pct}%</span>
        <span className="text-neutral-400">Loading</span>
      </div>
    </>
  );
}
