import { notFound } from "next/navigation";
import PlayerFrame from "@/components/PlayerFrame";
import BackButton from "@/components/BackButton";
import DetailHero from "@/components/DetailHero";
import { getMovieDetails } from "@/lib/tmdb";

export const revalidate = 3600;

export default async function MoviePage(props: PageProps<"/movie/[id]">) {
  const { id } = await props.params;
  const tmdbId = Number(id);
  if (!tmdbId) notFound();

  let movie;
  try {
    movie = await getMovieDetails(tmdbId);
  } catch {
    notFound();
  }

  const year = movie.release_date?.slice(0, 4) ?? "";

  return (
    <div className="relative">
      <div className="absolute left-3 top-20 z-30 sm:left-8 sm:top-24">
        <BackButton />
      </div>

      <DetailHero
        id={tmdbId}
        mediaType="movie"
        title={movie.title}
        tagline={movie.tagline}
        overview={movie.overview}
        backdropPath={movie.backdrop_path}
        posterPath={movie.poster_path}
        rating={movie.vote_average}
        year={year}
        runtime={movie.runtime}
        genres={movie.genres ?? []}
        status={movie.status}
      />

      <section id="watch" className="mx-auto max-w-[1400px] px-4 py-14 sm:px-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="h-8 w-1.5 rounded-full bg-gradient-to-b from-red-500 to-orange-500" />
          <div>
            <h2 className="text-2xl font-black text-white sm:text-3xl">Watch Now</h2>
            <p className="text-sm text-neutral-400">Streaming {movie.title}</p>
          </div>
        </div>
        <PlayerFrame tmdbId={tmdbId} kind="movie" />
      </section>
    </div>
  );
}
