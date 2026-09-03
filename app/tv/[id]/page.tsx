import { notFound } from "next/navigation";
import EpisodeSelector from "@/components/EpisodeSelector";
import BackButton from "@/components/BackButton";
import DetailHero from "@/components/DetailHero";
import { getTVDetails } from "@/lib/tmdb";

export const revalidate = 3600;

export default async function TVPage(props: PageProps<"/tv/[id]">) {
  const { id } = await props.params;
  const tmdbId = Number(id);
  if (!tmdbId) notFound();

  let show;
  try {
    show = await getTVDetails(tmdbId);
  } catch {
    notFound();
  }

  const year = show.release_date?.slice(0, 4) ?? "";

  return (
    <div className="relative">
      <div className="absolute left-3 top-20 z-30 sm:left-8 sm:top-24">
        <BackButton />
      </div>

      <DetailHero
        id={tmdbId}
        mediaType="tv"
        title={show.title}
        tagline={show.tagline}
        overview={show.overview}
        backdropPath={show.backdrop_path}
        posterPath={show.poster_path}
        rating={show.vote_average}
        year={year}
        seasons={show.number_of_seasons}
        episodes={show.number_of_episodes}
        genres={show.genres ?? []}
        status={show.status}
      />

      <section id="watch" className="mx-auto max-w-[1400px] px-4 py-14 sm:px-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="h-8 w-1.5 rounded-full bg-gradient-to-b from-red-500 to-orange-500" />
          <div>
            <h2 className="text-2xl font-black text-white sm:text-3xl">Watch Now</h2>
            <p className="text-sm text-neutral-400">Pick a season and episode below</p>
          </div>
        </div>
        <EpisodeSelector tmdbId={tmdbId} seasons={show.seasons ?? []} />
      </section>
    </div>
  );
}
