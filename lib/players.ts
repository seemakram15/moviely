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

export type PlayerOpts = { preferHindi?: boolean };

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
    movie: (id) => `https://player.videasy.net/movie/${id}?color=${THEME}`,
    tv: (id, s, e) => `https://player.videasy.net/tv/${id}/${s}/${e}?color=${THEME}`,
  },
  {
    id: "vidlink",
    name: "VidLink Pro",
    adFree: true,
    hindiSupport: false,
    // Loads Yandex Metrica + Google Tag Manager (analytics) but no ad networks.
    movie: (id) =>
      `https://vidlink.pro/movie/${id}?primaryColor=${THEME}&secondaryColor=f97316&iconColor=ffffff&autoplay=false&nextbutton=true`,
    tv: (id, s, e) =>
      `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=${THEME}&secondaryColor=f97316&iconColor=ffffff&autoplay=false&nextbutton=true`,
  },
  // ⚠️ Probe blocked — can't fully verify. Kept as fallbacks; may show ads.
  {
    id: "vidsrccc",
    name: "VidSrc CC",
    adFree: false,
    hindiSupport: true,
    movie: (id, o) =>
      `https://vidsrc.cc/v3/embed/movie/${id}${o?.preferHindi ? "?ds_lang=hi" : ""}`,
    tv: (id, s, e, o) =>
      `https://vidsrc.cc/v3/embed/tv/${id}/${s}/${e}${o?.preferHindi ? "?ds_lang=hi" : ""}`,
  },
  {
    id: "embedsu",
    name: "Embed.su",
    adFree: false,
    hindiSupport: true,
    movie: (id, o) =>
      `https://embed.su/embed/movie/${id}${o?.preferHindi ? "?lang=hi" : ""}`,
    tv: (id, s, e, o) =>
      `https://embed.su/embed/tv/${id}/${s}/${e}${o?.preferHindi ? "?lang=hi" : ""}`,
  },
  {
    id: "vidking",
    name: "VidKing",
    adFree: false,
    hindiSupport: false,
    movie: (id) => `https://www.vidking.net/embed/movie/${id}`,
    tv: (id, s, e) => `https://www.vidking.net/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "autoembed",
    name: "AutoEmbed",
    adFree: false,
    hindiSupport: false,
    movie: (id) => `https://player.autoembed.cc/embed/movie/${id}`,
    tv: (id, s, e) => `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}`,
  },
];

export function getSource(id: string): PlayerSource {
  return SOURCES.find((s) => s.id === id) ?? SOURCES[0];
}
