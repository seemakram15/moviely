// Free embed players, no auth, no accounts.
// Last audited: 2026-10-02
// Removed: Videasy (domain dead), VidSrc CC (403/unreachable), embed.su (down), videm (blocked)
// Active: VidCore (ad-free, 4K), VidLink Pro, VidSrc.fyi, VidSrc.io, VidSrc.xyz (Hindi audio)

export type PlayerOpts = { autoplay?: boolean; lang?: string };

// Append query params, respecting whatever the base URL already has.
function q(base: string, params: Record<string, string | undefined>): string {
  const pairs = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${v}`);
  if (!pairs.length) return base;
  return base + (base.includes("?") ? "&" : "?") + pairs.join("&");
}

export type PlayerSource = {
  id: string;
  name: string;
  label?: string; // short UI label
  hint?: string;  // user-facing note (e.g. "Hindi audio available")
  movie: (tmdbId: number | string, opts?: PlayerOpts) => string;
  tv: (tmdbId: number | string, season: number, episode: number, opts?: PlayerOpts) => string;
};

const THEME = "ef4444";

export const SOURCES: PlayerSource[] = [
  {
    // Ad-free. 4K HLS, 30+ subtitle langs, 99.9% uptime SLA.
    // Takes 20-30s to connect — server is fetching stream in real-time.
    id: "vidcore",
    name: "VidCore",
    hint: "4K · Ad-free · 20-30s connect",
    movie: (id, o) =>
      q(`https://vidcore.org/embed/movie/${id}`, {
        theme: THEME,
        autoplay: o?.autoplay ? "true" : undefined,
      }),
    tv: (id, s, e, o) =>
      q(`https://vidcore.org/embed/tv/${id}/${s}/${e}`, {
        theme: THEME,
        autoplay: o?.autoplay ? "true" : undefined,
      }),
  },
  {
    id: "vidlink",
    name: "VidLink",
    hint: "Fast · Multi-server",
    movie: (id, o) =>
      q(`https://vidlink.pro/movie/${id}`, {
        primaryColor: THEME,
        secondaryColor: "f97316",
        iconColor: "ffffff",
        autoplay: o?.autoplay ? "true" : "false",
        nextbutton: "true",
      }),
    tv: (id, s, e, o) =>
      q(`https://vidlink.pro/tv/${id}/${s}/${e}`, {
        primaryColor: THEME,
        secondaryColor: "f97316",
        iconColor: "ffffff",
        autoplay: o?.autoplay ? "true" : "false",
        nextbutton: "true",
      }),
  },
  {
    // 1080p, 50+ subtitle langs, multi-server auto-failover.
    id: "vidsrcfyi",
    name: "VidSrc",
    hint: "1080p · Fast",
    movie: (id, o) =>
      q(`https://vidsrc.fyi/embed/movie/${id}`, {
        autoplay: o?.autoplay ? "true" : undefined,
      }),
    tv: (id, s, e, o) =>
      q(`https://vidsrc.fyi/embed/tv/${id}/${s}/${e}`, {
        autoplay: o?.autoplay ? "true" : undefined,
      }),
  },
  {
    // Alternative VidSrc — different server pool, often faster in South Asia.
    id: "vidsrcio",
    name: "VidSrc Alt",
    hint: "Fast in South Asia",
    movie: (id, o) =>
      q(`https://vidsrc.io/embed/movie/${id}`, {
        autoplay: o?.autoplay ? "true" : undefined,
      }),
    tv: (id, s, e, o) =>
      q(`https://vidsrc.io/embed/tv/${id}/${s}/${e}`, {
        autoplay: o?.autoplay ? "true" : undefined,
      }),
  },
  {
    // Multi-audio including Hindi dubbed for many titles.
    id: "vidsrcxyz",
    name: "HindiAudio",
    hint: "Hindi · Dubbed · Multi-audio",
    movie: (id, o) =>
      q(`https://vidsrc.xyz/embed/movie/${id}`, {
        autoplay: o?.autoplay ? "true" : undefined,
      }),
    tv: (id, s, e, o) =>
      q(`https://vidsrc.xyz/embed/tv/${id}/${s}/${e}`, {
        autoplay: o?.autoplay ? "true" : undefined,
      }),
  },
  {
    // Aggregates multiple servers with auto-failover.
    id: "embedsu",
    name: "Embed.su",
    hint: "Multi-server",
    movie: (id, o) =>
      q(`https://embed.su/embed/movie/${id}`, {
        autoplay: o?.autoplay ? "1" : undefined,
      }),
    tv: (id, s, e, o) =>
      q(`https://embed.su/embed/tv/${id}/${s}/${e}`, {
        autoplay: o?.autoplay ? "1" : undefined,
      }),
  },
];

export function getSource(id: string): PlayerSource {
  return SOURCES.find((s) => s.id === id) ?? SOURCES[0];
}

// Origins to preconnect — one per player. Kept in sync with SOURCES above.
// ponytail: hard-coded list, regenerate if you edit SOURCES.
export const PLAYER_ORIGINS = [
  "https://vidcore.org",
  "https://vidlink.pro",
  "https://vidsrc.fyi",
  "https://vidsrc.io",
  "https://vidsrc.xyz",
  "https://embed.su",
];

export function originOf(source: PlayerSource): string {
  try {
    return new URL(source.movie(1)).origin;
  } catch {
    return "";
  }
}
