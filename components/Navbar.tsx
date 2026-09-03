"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS: [string, string][] = [
  ["/", "Home"],
  ["/browse?type=movie", "Movies"],
  ["/browse?type=tv", "TV Shows"],
  ["/browse?region=bollywood", "Bollywood"],
  ["/browse?region=lollywood", "Lollywood"],
  ["/browse?region=korean", "K-Drama"],
  ["/browse?region=anime", "Anime"],
  ["/browse", "Browse"],
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock scroll while the mobile menu is open.
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isActive = (href: string) => pathname === href.split("?")[0];

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-white/5 bg-neutral-950/85 backdrop-blur-lg"
            : "bg-gradient-to-b from-black/80 via-black/40 to-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-3 py-3 sm:gap-8 sm:px-8">
          {/* Mobile: menu button */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white transition hover:bg-white/10 md:hidden"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>

          <Link href="/" className="group flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-red-500 to-orange-500 text-lg font-black text-white shadow-lg shadow-red-500/30">
              M
            </span>
            <span className="text-lg font-black tracking-tight text-white">Moviely</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 md:flex">
            {LINKS.map(([href, label]) => (
              <Link
                key={href + label}
                href={href}
                className={`text-sm font-medium transition ${
                  isActive(href) ? "text-white" : "text-neutral-400 hover:text-white"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Search */}
          <form
            action="/search"
            className="ml-auto flex min-w-0 items-center rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 backdrop-blur focus-within:border-red-500/50 focus-within:bg-white/[0.09]"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="shrink-0 text-neutral-400"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
            <input
              name="q"
              type="search"
              placeholder="Search"
              aria-label="Search titles"
              className="ml-2 w-24 min-w-0 bg-transparent text-sm text-white placeholder:text-neutral-500 focus:outline-none sm:w-48 md:w-64"
            />
          </form>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-[60] md:hidden ${menuOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!menuOpen}
      >
        <div
          className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-200 ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMenuOpen(false)}
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-72 max-w-[80vw] flex-col border-r border-white/10 bg-neutral-950 shadow-2xl transition-transform duration-300 ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <Link href="/" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-red-500 to-orange-500 text-lg font-black text-white">
                M
              </span>
              <span className="text-lg font-black text-white">Moviely</span>
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="grid h-9 w-9 place-items-center rounded-lg text-white transition hover:bg-white/10"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
            {LINKS.map(([href, label]) => (
              <Link
                key={href + label}
                href={href}
                className={`rounded-lg px-3 py-3 text-base font-medium transition ${
                  isActive(href)
                    ? "bg-gradient-to-r from-red-500/20 to-orange-500/10 text-white ring-1 ring-red-500/30"
                    : "text-neutral-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-white/5 px-5 py-4 text-[11px] text-neutral-500">
            Powered by TMDB
          </div>
        </aside>
      </div>
    </>
  );
}
