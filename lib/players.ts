// Free embed players (no auth, no keys). Multiple sources so users can switch
// if one is down or geo-blocked. All accept TMDB IDs — no scraping required.
// Sources: vidking.net (per user link), vidsrc.to, 2embed.cc, autoembed.co.

export type PlayerSource = {
  id: string;
  name: string;
  movie: (tmdbId: number | string) => string;
  tv: (tmdbId: number | string, season: number, episode: number) => string;
};

export const SOURCES: PlayerSource[] = [
  {
    id: "vidking",
    name: "VidKing",
    movie: (id) => `https://www.vidking.net/embed/movie/${id}`,
    tv: (id, s, e) => `https://www.vidking.net/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "vidsrc",
    name: "VidSrc",
    movie: (id) => `https://vidsrc.to/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "2embed",
    name: "2Embed",
    movie: (id) => `https://www.2embed.cc/embed/${id}`,
    tv: (id, s, e) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
  },
  {
    id: "autoembed",
    name: "AutoEmbed",
    movie: (id) => `https://player.autoembed.cc/embed/movie/${id}`,
    tv: (id, s, e) => `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}`,
  },
];

export function getSource(id: string): PlayerSource {
  return SOURCES.find((s) => s.id === id) ?? SOURCES[0];
}
