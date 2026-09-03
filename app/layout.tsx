import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://moviely.qzz.io";
const SITE_NAME = "Moviely";
const DESCRIPTION =
  "Watch trending movies and TV shows — Bollywood, Hollywood, K-Drama, Anime, Turkish, and more. Built by Waseem Akram.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Moviely — Watch Movies & TV Shows",
    template: "%s · Moviely",
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "Waseem Akram" }],
  creator: "Waseem Akram",
  publisher: "Waseem Akram",
  keywords: [
    "movies",
    "tv shows",
    "streaming",
    "Bollywood",
    "Hollywood",
    "K-Drama",
    "Korean drama",
    "Anime",
    "Lollywood",
    "Punjabi movies",
    "Turkish series",
    "watch online",
    "free movies",
    "Moviely",
  ],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "Moviely — Watch Movies & TV Shows",
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Moviely — Watch Movies & TV Shows",
    description: DESCRIPTION,
    creator: "@waseemakram",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // Silences hydration warnings caused by browser extensions that inject
      // attributes onto <html> before React hydrates (e.g. Cap, Grammarly,
      // ColorZilla). Only the <html> attributes are ignored — component-level
      // hydration is still validated normally.
      suppressHydrationWarning
    >
      <body className="min-h-full bg-neutral-950 text-neutral-100" suppressHydrationWarning>
        <Navbar />
        <main>{children}</main>
        <footer className="mt-24 border-t border-white/5 bg-black">
          {/* Developer signature — prominent, top of the footer */}
          <div className="border-b border-white/5 bg-gradient-to-r from-red-500/[0.06] via-transparent to-orange-500/[0.06]">
            <div className="mx-auto flex max-w-[1600px] flex-col items-center gap-2 px-4 py-8 text-center sm:px-8 sm:py-10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-500">
                Crafted with ♥ by
              </p>
              <p className="text-3xl font-black tracking-tight sm:text-4xl">
                <span className="bg-gradient-to-r from-red-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                  Waseem Akram
                </span>
              </p>
              <p className="max-w-md text-xs text-neutral-500 sm:text-sm">
                Full-stack developer · Building beautiful, fast, and functional web experiences
              </p>
            </div>
          </div>

          <div className="mx-auto max-w-[1600px] px-4 py-10 sm:px-8 sm:py-12">
            <div className="grid gap-6 sm:grid-cols-2 sm:gap-8 md:grid-cols-4">
              <div className="sm:col-span-2 md:col-span-1">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-red-500 to-orange-500 text-lg font-black text-white">
                    M
                  </span>
                  <span className="text-lg font-black text-white">Moviely</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-neutral-400">
                  A personal, non-commercial movie & TV discovery app. Metadata by TMDB, playback by third-party embed sources.
                </p>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-300">
                  Browse
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-neutral-400">
                  <li><Link href="/" className="hover:text-white">Home</Link></li>
                  <li><Link href="/?tab=movies" className="hover:text-white">Movies</Link></li>
                  <li><Link href="/?tab=tv" className="hover:text-white">TV Shows</Link></li>
                  <li><Link href="/search" className="hover:text-white">Search</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-300">
                  Sources
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-neutral-400">
                  <li>VidKing</li>
                  <li>VidSrc</li>
                  <li>2Embed</li>
                  <li>AutoEmbed</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-300">
                  Info
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-neutral-400">
                  <li>
                    <a
                      href="https://www.themoviedb.org/"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-white"
                    >
                      TMDB
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.vidking.net/#documentation"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-white"
                    >
                      VidKing docs
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 sm:flex-row">
              <p className="max-w-lg text-center text-xs text-neutral-500 sm:text-left">
                Data provided by{" "}
                <a href="https://www.themoviedb.org/" className="underline hover:text-neutral-300">TMDB</a>. This product uses the TMDB API but is not endorsed or certified by TMDB.
              </p>
              <div className="flex flex-col items-center gap-1 text-center sm:items-end sm:text-right">
                <p className="text-[11px] uppercase tracking-widest text-neutral-500">
                  Designed & Built by
                </p>
                <p className="text-base font-black tracking-tight text-white">
                  <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                    Waseem Akram
                  </span>
                </p>
                <p className="text-[11px] text-neutral-600">© {new Date().getFullYear()} Moviely</p>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
