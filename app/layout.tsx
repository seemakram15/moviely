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

export const metadata: Metadata = {
  title: "Moviely — Watch Movies & TV Shows",
  description:
    "Stream trending movies and TV shows. Powered by TMDB and free embed players.",
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
            <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 text-xs text-neutral-500 sm:flex-row">
              <p>
                Data provided by{" "}
                <a href="https://www.themoviedb.org/" className="underline hover:text-neutral-300">TMDB</a>. This product uses the TMDB API but is not endorsed or certified by TMDB.
              </p>
              <p>© {new Date().getFullYear()} Moviely.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
