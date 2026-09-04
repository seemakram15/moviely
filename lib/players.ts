// Free embed players, no auth, no accounts. Sorted rough best → fallback.
// Ad-free sources listed first; older/adier ones kept as fallbacks in case
// a viewer's region blocks the good ones.
//
// Hindi-dub support: not every source can serve a Hindi audio track. Where a
// source has an official language-preference URL param, we honour the
// `preferHindi` flag by appending it. Where it doesn't, the flag is ignored
// silently — the player just uses the source's default audio.

export type PlayerOpts = { preferHindi?: boolean };

export type PlayerSource = {
  id: string;
  name: string;
  /** true = confirmed ad-free (or extremely ad-lite) in current testing. */
  adFree: boolean;
  /** true = a URL param actually swaps the audio track when Hindi is available. */
  hindiSupport: boolean;
  movie: (tmdbId: number | string, opts?: PlayerOpts) => string;
  tv: (tmdbId: number | string, season: number, episode: number, opts?: PlayerOpts) => string;
};

/** Deep red UI color for players that support it — matches the site theme. */
const THEME = "ef4444";

export const SOURCES: PlayerSource[] = [
  {
    id: "vidlink",
    name: "VidLink Pro",
    adFree: true,
    hindiSupport: false,
    // vidlink.pro has a native web player with speed/volume/quality/PIP built in
    // and supports these theme params — no ads on their embed by default.
    movie: (id) =>
      `https://vidlink.pro/movie/${id}?primaryColor=${THEME}&secondaryColor=f97316&iconColor=ffffff&autoplay=false&nextbutton=true`,
    tv: (id, s, e) =>
      `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=${THEME}&secondaryColor=f97316&iconColor=ffffff&autoplay=false&nextbutton=true`,
  },
  {
    id: "videasy",
    name: "Videasy",
    adFree: true,
    hindiSupport: false,
    movie: (id) => `https://player.videasy.net/movie/${id}?color=${THEME}`,
    tv: (id, s, e) => `https://player.videasy.net/tv/${id}/${s}/${e}?color=${THEME}`,
  },
  {
    id: "vidsrccc",
    name: "VidSrc CC",
    adFree: false,
    hindiSupport: true,
    // vidsrc.cc v3 accepts ?ds_lang=hi to pick Hindi audio when the source
    // has it. Otherwise falls through to default audio.
    movie: (id, o) =>
      `https://vidsrc.cc/v3/embed/movie/${id}${o?.preferHindi ? "?ds_lang=hi" : ""}`,
    tv: (id, s, e, o) =>
      `https://vidsrc.cc/v3/embed/tv/${id}/${s}/${e}${o?.preferHindi ? "?ds_lang=hi" : ""}`,
  },
  {
    id: "embedsu",
    name: "Embed.su",
    adFree: true,
    hindiSupport: true,
    movie: (id, o) =>
      `https://embed.su/embed/movie/${id}${o?.preferHindi ? "?lang=hi" : ""}`,
    tv: (id, s, e, o) =>
      `https://embed.su/embed/tv/${id}/${s}/${e}${o?.preferHindi ? "?lang=hi" : ""}`,
  },
  {
    id: "moviesapi",
    name: "MoviesAPI",
    adFree: true,
    hindiSupport: false,
    movie: (id) => `https://moviesapi.club/movie/${id}`,
    tv: (id, s, e) => `https://moviesapi.club/tv/${id}-${s}-${e}`,
  },
  {
    id: "nontongo",
    name: "Nontongo",
    adFree: true,
    hindiSupport: false,
    movie: (id) => `https://www.nontongo.win/embed/movie/${id}`,
    tv: (id, s, e) => `https://www.nontongo.win/embed/tv/${id}/${s}/${e}`,
  },
  // --- Fallbacks (may have popup ads — kept in case the ad-free sources are
  // blocked or DMCA'd in a viewer's region). ---
  {
    id: "vidking",
    name: "VidKing",
    adFree: false,
    hindiSupport: false,
    movie: (id) => `https://www.vidking.net/embed/movie/${id}`,
    tv: (id, s, e) => `https://www.vidking.net/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "vidsrc",
    name: "VidSrc",
    adFree: false,
    hindiSupport: false,
    movie: (id) => `https://vidsrc.to/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "2embed",
    name: "2Embed",
    adFree: false,
    hindiSupport: false,
    movie: (id) => `https://www.2embed.cc/embed/${id}`,
    tv: (id, s, e) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
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
