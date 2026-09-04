import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import RouteProgress from "@/components/RouteProgress";

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

function FooterCol({
  title,
  align = "left",
  children,
}: {
  title: string;
  align?: "left" | "center" | "right";
  children: React.ReactNode;
}) {
  const alignCls =
    align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
  return (
    <div className={alignCls}>
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-white">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const cls = "text-neutral-400 transition hover:text-white";
  return (
    <li>
      {external ? (
        <a href={href} target="_blank" rel="noreferrer" className={cls}>
          {children}
        </a>
      ) : (
        <Link href={href} className={cls}>
          {children}
        </Link>
      )}
    </li>
  );
}

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
        <RouteProgress />
        <Navbar />
        <main>{children}</main>
        <footer className="mt-20 border-t border-white/5 bg-black">
          <div className="mx-auto max-w-[1600px] px-4 py-10 sm:px-8 sm:py-14">
            {/* Brand + tagline — full-width row */}
            <div>
              <Link href="/" className="inline-flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-red-500 to-orange-500 text-lg font-black text-white shadow-lg shadow-red-500/30">
                  M
                </span>
                <span className="text-xl font-black tracking-tight text-white">Moviely</span>
              </Link>
              <p className="mt-3 text-sm leading-relaxed text-neutral-400">
                Discover and stream movies &amp; TV shows from every corner of the world.
              </p>
            </div>

            {/* Divider */}
            <div className="my-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Link columns — full width, left / middle / right */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8">
              <FooterCol title="Browse" align="left">
                <FooterLink href="/">Home</FooterLink>
                <FooterLink href="/browse?type=movie">Movies</FooterLink>
                <FooterLink href="/browse?type=tv">TV Shows</FooterLink>
                <FooterLink href="/browse">All Filters</FooterLink>
              </FooterCol>

              <FooterCol title="Regions" align="center">
                <FooterLink href="/browse?region=hollywood">Hollywood</FooterLink>
                <FooterLink href="/browse?region=bollywood">Bollywood</FooterLink>
                <FooterLink href="/browse?region=korean">K-Drama</FooterLink>
                <FooterLink href="/browse?region=anime">Anime</FooterLink>
              </FooterCol>

              <FooterCol title="About" align="right">
                <FooterLink href="https://www.themoviedb.org/" external>TMDB</FooterLink>
                <FooterLink href="https://www.vidking.net/#documentation" external>VidKing</FooterLink>
                <FooterLink href="/search">Search</FooterLink>
              </FooterCol>
            </div>

            {/* Divider */}
            <div className="my-10 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Signature — centered */}
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-500">
                Crafted with ♥ by
              </p>
              <p className="text-3xl font-black tracking-tight sm:text-4xl">
                <span className="bg-gradient-to-r from-red-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                  Waseem Akram
                </span>
              </p>
              <p className="text-xs text-neutral-500">
                Full-stack developer · Beautiful, fast, functional web
              </p>
            </div>

            {/* Bottom bar */}
            <div className="mt-10 flex flex-col-reverse items-center gap-3 border-t border-white/5 pt-6 text-[11px] text-neutral-500 sm:flex-row sm:justify-between">
              <p>© {new Date().getFullYear()} Moviely · All rights reserved</p>
              <p className="text-center sm:text-right">
                Data by{" "}
                <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer" className="text-neutral-400 underline decoration-neutral-700 underline-offset-2 hover:text-white">TMDB</a>
                {" "}· Not endorsed or certified by TMDB
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
