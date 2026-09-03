// TMDB v3 API client. Server-only — never imports in a "use client" file.
// Get a free key at https://www.themoviedb.org/settings/api and set TMDB_API_KEY.

const BASE = "https://api.themoviedb.org/3";
export const IMG = "https://image.tmdb.org/t/p";

export type MediaType = "movie" | "tv";

export interface MediaItem {
  id: number;
  media_type: MediaType;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date: string; // YYYY-MM-DD or ""
  genre_ids?: number[];
}

export interface MovieDetails extends MediaItem {
  runtime: number | null;
  tagline: string;
  genres: { id: number; name: string }[];
  status: string;
}

export interface TVDetails extends MediaItem {
  number_of_seasons: number;
  number_of_episodes: number;
  tagline: string;
  genres: { id: number; name: string }[];
  seasons: {
    id: number;
    season_number: number;
    name: string;
    episode_count: number;
    poster_path: string | null;
  }[];
  status: string;
}

export interface Episode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string;
  runtime: number | null;
  vote_average: number;
}

interface RawItem {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: MediaType;
  genre_ids?: number[];
}

function normalize(item: RawItem, fallbackType: MediaType): MediaItem {
  const mt = (item.media_type ?? fallbackType) as MediaType;
  return {
    id: item.id,
    media_type: mt,
    title: item.title ?? item.name ?? "Untitled",
    overview: item.overview ?? "",
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    vote_average: item.vote_average ?? 0,
    release_date: item.release_date ?? item.first_air_date ?? "",
    genre_ids: item.genre_ids,
  };
}

async function tmdb<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const key = process.env.TMDB_API_KEY;
  if (!key) {
    throw new Error(
      "TMDB_API_KEY is not set. Copy .env.local.example to .env.local and add your key from https://www.themoviedb.org/settings/api"
    );
  }
  const url = new URL(BASE + path);
  url.searchParams.set("api_key", key);
  url.searchParams.set("language", "en-US");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`TMDB ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function getTrending(): Promise<MediaItem[]> {
  const data = await tmdb<{ results: RawItem[] }>("/trending/all/week");
  return data.results
    .filter((r) => r.media_type === "movie" || r.media_type === "tv")
    .map((r) => normalize(r, "movie"));
}

export async function getPopularMovies(page = 1): Promise<MediaItem[]> {
  const data = await tmdb<{ results: RawItem[] }>("/movie/popular", { page: String(page) });
  return data.results.map((r) => normalize(r, "movie"));
}

export async function getPopularTV(page = 1): Promise<MediaItem[]> {
  const data = await tmdb<{ results: RawItem[] }>("/tv/popular", { page: String(page) });
  return data.results.map((r) => normalize(r, "tv"));
}

export async function getTopRatedMovies(): Promise<MediaItem[]> {
  const data = await tmdb<{ results: RawItem[] }>("/movie/top_rated");
  return data.results.map((r) => normalize(r, "movie"));
}

export async function getNowPlayingMovies(): Promise<MediaItem[]> {
  const data = await tmdb<{ results: RawItem[] }>("/movie/now_playing");
  return data.results.map((r) => normalize(r, "movie"));
}

// Generic /discover — any combination of TMDB filters.
export async function discover(
  kind: MediaType,
  params: Record<string, string> = {}
): Promise<MediaItem[]> {
  const base = {
    sort_by: "popularity.desc",
    "vote_count.gte": kind === "movie" ? "50" : "20",
    include_adult: "false",
    ...params,
  };
  const data = await tmdb<{ results: RawItem[] }>(`/discover/${kind}`, base);
  return data.results.map((r) => normalize(r, kind));
}

/** Discover with pagination + total pages, for the /browse page. */
export async function discoverPage(
  kind: MediaType,
  params: Record<string, string> = {}
): Promise<{ items: MediaItem[]; page: number; totalPages: number; totalResults: number }> {
  const base = {
    sort_by: "popularity.desc",
    "vote_count.gte": kind === "movie" ? "50" : "20",
    include_adult: "false",
    ...params,
  };
  const data = await tmdb<{
    results: RawItem[];
    page: number;
    total_pages: number;
    total_results: number;
  }>(`/discover/${kind}`, base);
  return {
    items: data.results.map((r) => normalize(r, kind)),
    page: data.page,
    totalPages: Math.min(data.total_pages, 500), // TMDB caps at 500 pages
    totalResults: data.total_results,
  };
}

// Curated region + language presets. Filters chosen empirically to actually
// return content — some catalogs are sparse, so we combine language + country
// where a single filter is too narrow.
// Each region combines original_language + origin_country AND-style so a Korean
// dub of a Bollywood film doesn't leak into K-Drama (and vice-versa). TMDB's
// `with_origin_country` is a strict AND filter with `with_original_language`.
export const REGIONS = {
  hollywood: { label: "🇺🇸 Hollywood", movie: { with_origin_country: "US", with_original_language: "en" }, tv: { with_origin_country: "US", with_original_language: "en" } },
  bollywood: { label: "🇮🇳 Bollywood", movie: { with_origin_country: "IN", with_original_language: "hi" }, tv: { with_origin_country: "IN", with_original_language: "hi" } },
  punjabi:   { label: "🇮🇳 Punjabi",   movie: { with_origin_country: "IN", with_original_language: "pa" }, tv: { with_origin_country: "IN", with_original_language: "pa" } },
  tamil:     { label: "🇮🇳 Tamil",     movie: { with_origin_country: "IN", with_original_language: "ta" }, tv: { with_origin_country: "IN", with_original_language: "ta" } },
  telugu:    { label: "🇮🇳 Telugu",    movie: { with_origin_country: "IN", with_original_language: "te" }, tv: { with_origin_country: "IN", with_original_language: "te" } },
  malayalam: { label: "🇮🇳 Malayalam", movie: { with_origin_country: "IN", with_original_language: "ml" }, tv: { with_origin_country: "IN", with_original_language: "ml" } },
  lollywood: { label: "🇵🇰 Lollywood — Urdu", movie: { with_origin_country: "PK", with_original_language: "ur" }, tv: { with_origin_country: "PK", with_original_language: "ur" } },
  pakistan:  { label: "🇵🇰 Pakistani (all)",  movie: { with_origin_country: "PK" }, tv: { with_origin_country: "PK" } },
  pashto:    { label: "🇵🇰 Pashto",           movie: { with_origin_country: "PK", with_original_language: "ps" }, tv: { with_origin_country: "PK", with_original_language: "ps" } },
  korean:    { label: "🇰🇷 Korean",    movie: { with_origin_country: "KR", with_original_language: "ko" }, tv: { with_origin_country: "KR", with_original_language: "ko" } },
  japanese:  { label: "🇯🇵 Japanese",  movie: { with_origin_country: "JP", with_original_language: "ja" }, tv: { with_origin_country: "JP", with_original_language: "ja" } },
  anime:     { label: "🇯🇵 Anime",     movie: { with_origin_country: "JP", with_original_language: "ja", with_genres: "16" }, tv: { with_origin_country: "JP", with_original_language: "ja", with_genres: "16" } },
  chinese:   { label: "🇨🇳 Chinese",   movie: { with_origin_country: "CN", with_original_language: "zh" }, tv: { with_origin_country: "CN", with_original_language: "zh" } },
  turkish:   { label: "🇹🇷 Turkish",   movie: { with_origin_country: "TR", with_original_language: "tr" }, tv: { with_origin_country: "TR", with_original_language: "tr" } },
  spanish:   { label: "🇪🇸 Spanish",   movie: { with_origin_country: "ES", with_original_language: "es" }, tv: { with_origin_country: "ES", with_original_language: "es" } },
  french:    { label: "🇫🇷 French",    movie: { with_origin_country: "FR", with_original_language: "fr" }, tv: { with_origin_country: "FR", with_original_language: "fr" } },
  german:    { label: "🇩🇪 German",    movie: { with_origin_country: "DE", with_original_language: "de" }, tv: { with_origin_country: "DE", with_original_language: "de" } },
  italian:   { label: "🇮🇹 Italian",   movie: { with_origin_country: "IT", with_original_language: "it" }, tv: { with_origin_country: "IT", with_original_language: "it" } },
  russian:   { label: "🇷🇺 Russian",   movie: { with_origin_country: "RU", with_original_language: "ru" }, tv: { with_origin_country: "RU", with_original_language: "ru" } },
  arabic:    { label: "🇸🇦 Arabic",    movie: { with_original_language: "ar" }, tv: { with_original_language: "ar" } },
  bengali:   { label: "🇧🇩 Bengali",   movie: { with_original_language: "bn" }, tv: { with_original_language: "bn" } },
} as const;

export const SORT_OPTIONS = {
  "popularity.desc": "Most Popular",
  "popularity.asc": "Least Popular",
  "vote_average.desc": "Highest Rated",
  "vote_average.asc": "Lowest Rated",
  "primary_release_date.desc": "Newest (Movies)",
  "primary_release_date.asc": "Oldest (Movies)",
  "first_air_date.desc": "Newest (TV)",
  "first_air_date.asc": "Oldest (TV)",
  "vote_count.desc": "Most Voted",
  "revenue.desc": "Highest Revenue",
} as const;

export type RegionKey = keyof typeof REGIONS;

export async function getByRegion(kind: MediaType, region: RegionKey): Promise<MediaItem[]> {
  return discover(kind, REGIONS[region][kind]);
}

// TMDB movie genre IDs — see https://developers.themoviedb.org/3/genres/get-movie-list
export const GENRES = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  horror: 27,
  mystery: 9648,
  romance: 10749,
  scifi: 878,
  thriller: 53,
  war: 10752,
  western: 37,
} as const;

export type GenreKey = keyof typeof GENRES;

export async function getByGenre(kind: MediaType, genre: GenreKey): Promise<MediaItem[]> {
  return discover(kind, { with_genres: String(GENRES[genre]) });
}

// Back-compat exports (used by earlier code)
export async function getHindiMovies() {
  return getByRegion("movie", "bollywood");
}
export async function getHindiTV() {
  return getByRegion("tv", "bollywood");
}

export async function getMovieDetails(id: number): Promise<MovieDetails> {
  const raw = await tmdb<RawItem & Partial<MovieDetails>>(`/movie/${id}`);
  return { ...normalize(raw, "movie"), ...(raw as unknown as MovieDetails) };
}

export async function getTVDetails(id: number): Promise<TVDetails> {
  const raw = await tmdb<RawItem & Partial<TVDetails>>(`/tv/${id}`);
  return { ...normalize(raw, "tv"), ...(raw as unknown as TVDetails) };
}

export async function getSeason(
  tvId: number,
  seasonNumber: number
): Promise<{ episodes: Episode[]; name: string; overview: string }> {
  return tmdb(`/tv/${tvId}/season/${seasonNumber}`);
}

export interface Video {
  key: string;
  site: string;
  type: string;
  official: boolean;
  name: string;
}

export async function getVideos(kind: MediaType, id: number): Promise<Video[]> {
  try {
    const data = await tmdb<{ results: Video[] }>(`/${kind}/${id}/videos`);
    return data.results ?? [];
  } catch {
    return [];
  }
}

/** Rank YouTube videos: official Trailer > any Trailer > Teaser > Clip > rest. */
export function rankTrailerCandidates(videos: Video[]): string[] {
  const yt = videos.filter((v) => v.site === "YouTube");
  const rank = (v: Video) => {
    if (v.type === "Trailer" && v.official) return 0;
    if (v.type === "Trailer") return 1;
    if (v.type === "Teaser" && v.official) return 2;
    if (v.type === "Teaser") return 3;
    if (v.type === "Clip") return 4;
    return 5;
  };
  return [...yt].sort((a, b) => rank(a) - rank(b)).map((v) => v.key);
}

/** Probe YouTube oEmbed. Age-restricted / embed-disabled videos return non-200. */
async function isEmbeddable(key: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${key}&format=json`,
      { next: { revalidate: 86400 } } // cache for a day — embeddability rarely changes
    );
    return res.ok;
  } catch {
    return false;
  }
}

/** Pick the highest-ranked YouTube key that actually embeds (skipping age-gated). */
export async function getTrailerKey(kind: MediaType, id: number): Promise<string | null> {
  const videos = await getVideos(kind, id);
  const candidates = rankTrailerCandidates(videos);
  // Cap the probe count so a movie with 50 videos doesn't hammer YouTube.
  for (const key of candidates.slice(0, 6)) {
    if (await isEmbeddable(key)) return key;
  }
  return null;
}

export async function searchMulti(query: string): Promise<MediaItem[]> {
  if (!query.trim()) return [];
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("TMDB_API_KEY not set");
  const url = new URL(BASE + "/search/multi");
  url.searchParams.set("api_key", key);
  url.searchParams.set("language", "en-US");
  url.searchParams.set("query", query);
  url.searchParams.set("include_adult", "false");
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`TMDB search failed: ${res.status}`);
  const data = (await res.json()) as { results: RawItem[] };
  return data.results
    .filter((r) => r.media_type === "movie" || r.media_type === "tv")
    .map((r) => normalize(r, (r.media_type ?? "movie") as MediaType));
}

export function posterUrl(
  path: string | null,
  size: "w200" | "w342" | "w500" | "original" = "w500"
): string {
  return path ? `${IMG}/${size}${path}` : "";
}

export function backdropUrl(
  path: string | null,
  size: "w780" | "w1280" | "original" = "original"
): string {
  return path ? `${IMG}/${size}${path}` : "";
}
