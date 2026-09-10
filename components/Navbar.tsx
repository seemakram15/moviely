"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Logo from "@/components/Logo";

type Link_ = { href: string; label: string };
type Group = { label: string; items: Link_[] };
type NavEntry = Link_ | Group;

const isGroup = (e: NavEntry): e is Group => "items" in e;

const REGIONS_MENU: Link_[] = [
  { href: "/browse?region=hollywood", label: "Hollywood" },
  { href: "/browse?region=bollywood", label: "Bollywood" },
  { href: "/browse?region=lollywood", label: "Lollywood" },
  { href: "/browse?region=korean", label: "K-Drama" },
  { href: "/browse?region=anime", label: "Anime" },
  { href: "/browse?region=japanese", label: "Japanese" },
  { href: "/browse?region=chinese", label: "Chinese" },
  { href: "/browse?region=turkish", label: "Turkish" },
  { href: "/browse?region=tamil", label: "Tamil" },
  { href: "/browse?region=telugu", label: "Telugu" },
  { href: "/browse?region=malayalam", label: "Malayalam" },
];

const TYPE_MENU: Link_[] = [
  { href: "/browse?type=movie", label: "Movies" },
  { href: "/browse?type=tv", label: "Web Series / TV Shows" },
  { href: "/browse?genre=action", label: "Action" },
  { href: "/browse?genre=animation", label: "Animation" },
  { href: "/browse?genre=comedy", label: "Comedy" },
  { href: "/browse?genre=horror", label: "Horror" },
  { href: "/browse?genre=thriller", label: "Thriller" },
  { href: "/browse?genre=romance", label: "Romance" },
  { href: "/browse?genre=scifi", label: "Sci-Fi" },
  { href: "/browse?genre=drama", label: "Drama" },
];

const NAV: NavEntry[] = [
  { href: "/", label: "Home" },
  { label: "Regions", items: REGIONS_MENU },
  { href: "/browse?region=punjabi", label: "Punjabi" },
  { label: "By Type", items: TYPE_MENU },
  { href: "/browse", label: "Browse" },
];

function Chevron() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true" className="mt-0.5">
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Desktop dropdown: opens on hover (mouseenter over button+panel) or click
 * (sticks open for touch/keyboard use), closes when the cursor leaves the
 * whole group, on outside click, on Escape, or on route change.
 */
function NavDropdown({ group, active }: { group: Group; active: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  // Small delay before closing so the cursor can cross the gap between the
  // trigger and the panel without the menu snapping shut mid-move.
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 200);
  };
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  useEffect(() => () => cancelClose(), []);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex items-center gap-1 text-sm font-medium transition ${
          active ? "text-white" : "text-neutral-400 hover:text-white"
        }`}
      >
        {group.label}
        <Chevron />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-10 mt-3 w-56 overflow-hidden rounded-xl border border-white/10 bg-neutral-950/95 py-2 shadow-2xl backdrop-blur-lg">
          {group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-2 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/** Mobile drawer accordion for a dropdown group. */
function MobileGroup({ group, onNavigate }: { group: Group; onNavigate: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-base font-medium text-neutral-300 transition hover:bg-white/5 hover:text-white"
      >
        {group.label}
        <span className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <Chevron />
        </span>
      </button>
      {open && (
        <div className="ml-3 flex flex-col gap-0.5 border-l border-white/10 pl-3">
          {group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className="rounded-lg px-3 py-2.5 text-sm text-neutral-400 transition hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

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
  const isGroupActive = (group: Group) => group.items.some((i) => isActive(i.href));

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
            <Logo size={32} />
            <span className="flex flex-col leading-tight">
              <span className="text-lg font-black tracking-tight text-white">Moviely</span>
              <span className="hidden text-[9px] font-medium uppercase tracking-wider text-neutral-500 sm:block">
                by Waseem Akram
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 md:flex">
            {NAV.map((entry) =>
              isGroup(entry) ? (
                <NavDropdown key={entry.label} group={entry} active={isGroupActive(entry)} />
              ) : (
                <Link
                  key={entry.href}
                  href={entry.href}
                  className={`text-sm font-medium transition ${
                    isActive(entry.href) ? "text-white" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {entry.label}
                </Link>
              )
            )}
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
              <Logo size={32} />
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
            {NAV.map((entry) =>
              isGroup(entry) ? (
                <MobileGroup key={entry.label} group={entry} onNavigate={() => setMenuOpen(false)} />
              ) : (
                <Link
                  key={entry.href}
                  href={entry.href}
                  className={`rounded-lg px-3 py-3 text-base font-medium transition ${
                    isActive(entry.href)
                      ? "bg-gradient-to-r from-red-500/20 to-orange-500/10 text-white ring-1 ring-red-500/30"
                      : "text-neutral-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {entry.label}
                </Link>
              )
            )}
          </nav>
          <div className="border-t border-white/5 px-5 py-4 text-[11px] text-neutral-500">
            Powered by TMDB
          </div>
        </aside>
      </div>
    </>
  );
}
