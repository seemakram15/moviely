import HeroSlider from "@/components/HeroSlider";
import AsyncRow from "@/components/AsyncRow";
import {
  getTrending,
  getPopularMovies,
  getPopularTV,
  getTopRatedMovies,
  getNowPlayingMovies,
  getByRegion,
  getByGenre,
  type MediaItem,
} from "@/lib/tmdb";

export const revalidate = 3600;

// Deterministic PRNG seeded by today's UTC date, so every visitor sees the
// same hero mix on the same day and a different one tomorrow — no client-side
// hydration mismatch, no personal randomness leaking in.
function seedForToday(): number {
  const d = new Date();
  return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
}
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Netflix-style hero mix — build a large pool of quality titles, then shuffle
// with today's date seed and take the top 5. The pool rotates every 24h.
function curateHero(
  popular: MediaItem[],
  bollywood: MediaItem[],
  trending: MediaItem[]
): MediaItem[] {
  const usable = (list: MediaItem[]) =>
    list.filter(
      (m) => m.media_type === "movie" && m.backdrop_path && m.poster_path && m.vote_average >= 6.5
    );
  // Combine + dedupe first, then shuffle.
  const pool = [...usable(popular), ...usable(bollywood), ...usable(trending)];
  const seen = new Set<number>();
  const unique = pool.filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)));
  const shuffled = shuffle(unique, mulberry32(seedForToday()));
  return shuffled.slice(0, 5);
}

export default async function Home() {
  // Await only the two feeds the hero needs; the rails all stream in parallel.
  let heroMix: MediaItem[] = [];
  try {
    const [popular, bollywood, trending] = await Promise.all([
      getPopularMovies(),
      getByRegion("movie", "bollywood"),
      getTrending(),
    ]);
    heroMix = curateHero(popular, bollywood, trending);
  } catch (err) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 pt-32 text-center">
        <h1 className="text-2xl font-bold text-white">Setup needed</h1>
        <p className="mt-3 text-neutral-400">
          {err instanceof Error ? err.message : "Failed to load data."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <HeroSlider items={heroMix} />
      <div className="mx-auto -mt-14 max-w-[1600px] pb-8">
        <AsyncRow title="🔥 Trending This Week" fetcher={getTrending} />
        <AsyncRow title="🎬 Now Playing" fetcher={getNowPlayingMovies} />
        <AsyncRow title="⭐ Popular Movies" fetcher={getPopularMovies} />
        <AsyncRow title="📺 Popular TV Shows" fetcher={getPopularTV} />

        <AsyncRow title="🇺🇸 Hollywood Blockbusters" fetcher={() => getByRegion("movie", "hollywood")} />
        <AsyncRow title="🇮🇳 Bollywood — बॉलीवुड" fetcher={() => getByRegion("movie", "bollywood")} />
        <AsyncRow title="🇮🇳 Bollywood TV" fetcher={() => getByRegion("tv", "bollywood")} />
        <AsyncRow title="🇵🇰 Lollywood — Urdu Cinema" fetcher={() => getByRegion("movie", "lollywood")} />
        <AsyncRow title="🇵🇰 Pakistani Films (All)" fetcher={() => getByRegion("movie", "pakistan")} />
        <AsyncRow title="🇮🇳 Punjabi Cinema" fetcher={() => getByRegion("movie", "punjabi")} />
        <AsyncRow title="🇮🇳 Tamil — Kollywood" fetcher={() => getByRegion("movie", "tamil")} />
        <AsyncRow title="🇮🇳 Telugu — Tollywood" fetcher={() => getByRegion("movie", "telugu")} />
        <AsyncRow title="🇰🇷 Korean Movies" fetcher={() => getByRegion("movie", "korean")} />
        <AsyncRow title="🇰🇷 K-Drama" fetcher={() => getByRegion("tv", "korean")} />
        <AsyncRow title="🇯🇵 Anime" fetcher={() => getByRegion("tv", "anime")} />
        <AsyncRow title="🇹🇷 Turkish Drama" fetcher={() => getByRegion("tv", "turkish")} />
        <AsyncRow title="🇪🇸 Spanish Series" fetcher={() => getByRegion("tv", "spanish")} />

        <AsyncRow title="💥 Action" fetcher={() => getByGenre("movie", "action")} />
        <AsyncRow title="🔪 Thriller" fetcher={() => getByGenre("movie", "thriller")} />
        <AsyncRow title="👻 Horror" fetcher={() => getByGenre("movie", "horror")} />
        <AsyncRow title="💘 Romance" fetcher={() => getByGenre("movie", "romance")} />

        <AsyncRow title="🏆 Top Rated" fetcher={getTopRatedMovies} />
      </div>
    </div>
  );
}
