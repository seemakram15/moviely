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

// Netflix-style hero mix: interleave top Hollywood + top Bollywood movies,
// drop TV, drop titles without a backdrop, cap at 6.
function curateHero(
  popular: MediaItem[],
  bollywood: MediaItem[],
  trending: MediaItem[]
): MediaItem[] {
  const usable = (list: MediaItem[]) =>
    list.filter((m) => m.media_type === "movie" && m.backdrop_path && m.vote_average >= 6);
  const hollywood = usable(popular);
  const boll = usable(bollywood);
  const trend = usable(trending);
  // Interleave: Hollywood, Bollywood, Trending, Hollywood, Bollywood, Trending
  const mix: MediaItem[] = [];
  const max = Math.max(hollywood.length, boll.length, trend.length);
  for (let i = 0; i < max && mix.length < 12; i++) {
    if (hollywood[i]) mix.push(hollywood[i]);
    if (boll[i]) mix.push(boll[i]);
    if (trend[i]) mix.push(trend[i]);
  }
  // Dedupe by id
  const seen = new Set<number>();
  const unique = mix.filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)));
  return unique.slice(0, 6);
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
