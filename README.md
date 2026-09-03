# 🎬 Moviely

Netflix-style movie & TV streaming site built with **Next.js 16 (App Router) + Tailwind v4**.
Data comes from **TMDB** (free, industry-standard). Playback uses free embed players — **VidKing** (default, per [vidking.net docs](https://www.vidking.net/#documentation)), plus VidSrc, 2Embed, and AutoEmbed as fallbacks the viewer can flip between.

## Stack

- **Next.js 16** — App Router, RSC, Turbopack
- **TypeScript + Tailwind CSS v4**
- **TMDB API** — trending, popular, top-rated, details, search, seasons/episodes
- **Multiple free embed players** — user-switchable if one fails / is geo-blocked

## Prerequisites

- **Node.js 20.9+** — required by Next 16 (you are currently on Node 16, which will fail; upgrade with [nvm](https://github.com/nvm-sh/nvm): `nvm install 20 && nvm use 20`)
- A free TMDB API key from https://www.themoviedb.org/settings/api

## Setup

```bash
# 1. Install deps (run once Node ≥ 20.9)
npm install

# 2. Environment
cp env.example .env.local
# Edit .env.local and paste your TMDB_API_KEY

# 3. Dev
npm run dev
# → http://localhost:3000
```

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing — hero banner + rails: Trending, Now Playing, Popular Movies, Popular TV, Top Rated |
| `/movie/[id]` | Movie detail + inline player |
| `/tv/[id]` | TV detail + season/episode picker + inline player |
| `/search?q=…` | Multi-search across movies & shows |
| `/api/season?tv=&season=` | JSON — episodes for a season (used by the episode picker) |

## Structure

```
app/
  page.tsx            landing
  layout.tsx          dark shell, navbar, footer
  globals.css         theme + scrollbar-hide
  movie/[id]/page.tsx movie detail + player
  tv/[id]/page.tsx    show detail + episode selector
  search/page.tsx     search results
  api/season/route.ts season-episodes JSON endpoint
components/
  Navbar.tsx
  HeroBanner.tsx
  MediaRow.tsx        horizontal scrollable rail
  MediaCard.tsx       poster card
  PlayerFrame.tsx     iframe + player switcher
  EpisodeSelector.tsx season + episode chooser (client)
lib/
  tmdb.ts             TMDB API client (server-only)
  players.ts          embed URL builders (VidKing/VidSrc/2Embed/AutoEmbed)
```

## Players

`lib/players.ts` maps a TMDB id to an embed URL for each source. Swap the default by re-ordering the `SOURCES` array. VidKing is first per the user link — the URL scheme is `https://www.vidking.net/embed/movie/{tmdbId}` and `https://www.vidking.net/embed/tv/{tmdbId}/{season}/{episode}`.

## Deploy

Push to GitHub, import in Vercel, set `TMDB_API_KEY` in project env vars, deploy.

## Notes

- All embed players are third-party and may have ads or rate limits — the switcher lets the viewer try another source.
- Everything renders server-side via RSC; only the player and episode picker are `"use client"`.
- Landing is ISR (`revalidate = 3600`) so TMDB gets cached for an hour.
