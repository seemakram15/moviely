// Free embed players, no auth, no accounts. Sorted by verified ad status.
//
// Verification methodology: fetched each embed's initial HTML server-side and
// inspected external <script src=""> hosts for known ad-network domains
// (popads, tagivi, blackninja.host, vsembed.ru, etc). Only sources whose
// initial page was clean AND blocked no probe were kept.
//
// Removed after verification (2026-09-04):
//   - 2Embed  → loads blackninja.host / tagivi.com / videm.xyz / whos.amung.us
//   - VidSrc  → loads vsembed.ru (Russian ad embed)
//
// Kept sources are marked with `adFree` reflecting what we could confirm:
//   true  = probe returned clean HTML with no third-party ad hosts
//   false = probe blocked OR ad networks / trackers found
//
// Hindi-dub support: honoured only where the source has a documented URL
// param for language preference (VidSrc CC's `ds_lang`, Embed.su's `lang`).
// Elsewhere the flag is a no-op and the player picks its default audio.

export type PlayerOpts = { preferHindi?: boolean; autoplay?: boolean };

// Append query params, respecting whatever the base URL already has.
// Unknown params are ignored by every provider, so a best-guess autoplay
// key is harmless where it isn't supported.
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
  adFree: boolean;
  hindiSupport: boolean;
  movie: (tmdbId: number | string, opts?: PlayerOpts) => string;
  tv: (tmdbId: number | string, season: number, episode: number, opts?: PlayerOpts) => string;
};

const THEME = "ef4444";

export const SOURCES: PlayerSource[] = [
  // ✅ Verified clean — no external ad domains loaded on the initial page.
  {
    id: "videasy",
    name: "Videasy",
    adFree: true,
    hindiSupport: false,
    movie: (id, o) =>
      q(`https://player.videasy.net/movie/${id}`, {
        color: THEME,
        autoplay: o?.autoplay ? "true" : undefined,
      }),
    tv: (id, s, e, o) =>
      q(`https://player.videasy.net/tv/${id}/${s}/${e}`, {
        color: THEME,
        autoplay: o?.autoplay ? "true" : undefined,
      }),
  },
  {
    id: "vidlink",
    name: "VidLink Pro",
    adFree: true,
    hindiSupport: false,
    // Loads Yandex Metrica + Google Tag Manager (analytics) but no ad networks.
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
  // ⚠️ Probe blocked — can't fully verify. Kept as fallbacks; may show ads.
  {
    id: "vidsrccc",
    name: "VidSrc CC",
    adFree: false,
    hindiSupport: true,
    movie: (id, o) =>
      q(`https://vidsrc.cc/v3/embed/movie/${id}`, {
        ds_lang: o?.preferHindi ? "hi" : undefined,
        autoPlay: o?.autoplay ? "true" : undefined,
      }),
    tv: (id, s, e, o) =>
      q(`https://vidsrc.cc/v3/embed/tv/${id}/${s}/${e}`, {
        ds_lang: o?.preferHindi ? "hi" : undefined,
        autoPlay: o?.autoplay ? "true" : undefined,
      }),
  },
  {
    id: "embedsu",
    name: "Embed.su",
    adFree: false,
    hindiSupport: true,
    movie: (id, o) =>
      q(`https://embed.su/embed/movie/${id}`, {
        lang: o?.preferHindi ? "hi" : undefined,
        autoplay: o?.autoplay ? "1" : undefined,
      }),
    tv: (id, s, e, o) =>
      q(`https://embed.su/embed/tv/${id}/${s}/${e}`, {
        lang: o?.preferHindi ? "hi" : undefined,
        autoplay: o?.autoplay ? "1" : undefined,
      }),
  },
  {
    id: "vidking",
    name: "VidKing",
    adFree: false,
    hindiSupport: false,
    movie: (id, o) =>
      q(`https://www.vidking.net/embed/movie/${id}`, {
        autoPlay: o?.autoplay ? "true" : undefined,
      }),
    tv: (id, s, e, o) =>
      q(`https://www.vidking.net/embed/tv/${id}/${s}/${e}`, {
        autoPlay: o?.autoplay ? "true" : undefined,
      }),
  },
  {
    id: "autoembed",
    name: "AutoEmbed",
    adFree: false,
    hindiSupport: false,
    movie: (id, o) =>
      q(`https://player.autoembed.cc/embed/movie/${id}`, {
        autoplay: o?.autoplay ? "1" : undefined,
      }),
    tv: (id, s, e, o) =>
      q(`https://player.autoembed.cc/embed/tv/${id}/${s}/${e}`, {
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
  "https://player.videasy.net",
  "https://vidlink.pro",
  "https://vidsrc.cc",
  "https://embed.su",
  "https://www.vidking.net",
  "https://player.autoembed.cc",
];

export function originOf(source: PlayerSource): string {
  // Cheap: peek at the URL a source would produce for a dummy id.
  try {
    return new URL(source.movie(1)).origin;
  } catch {
    return "";
  }
}
