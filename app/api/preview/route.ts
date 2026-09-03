import { NextResponse } from "next/server";
import { getTrailerKey, getMovieDetails, getTVDetails, type MediaType } from "@/lib/tmdb";

// Returns { trailerKey, runtime, seasons, tagline, genres } for a hover preview.
// Cached at the fetch layer by getMovieDetails/getTVDetails (revalidate: 3600).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as MediaType | null;
  const id = Number(searchParams.get("id"));
  if (!id || (type !== "movie" && type !== "tv")) {
    return NextResponse.json({ error: "type=movie|tv and id required" }, { status: 400 });
  }
  try {
    const [trailerKey, details] = await Promise.all([
      getTrailerKey(type, id),
      type === "movie" ? getMovieDetails(id) : getTVDetails(id),
    ]);
    const payload =
      type === "movie"
        ? {
            trailerKey,
            runtime: (details as Awaited<ReturnType<typeof getMovieDetails>>).runtime,
            tagline: (details as Awaited<ReturnType<typeof getMovieDetails>>).tagline,
            genres: (details as Awaited<ReturnType<typeof getMovieDetails>>).genres?.map((g) => g.name) ?? [],
          }
        : {
            trailerKey,
            seasons: (details as Awaited<ReturnType<typeof getTVDetails>>).number_of_seasons,
            episodes: (details as Awaited<ReturnType<typeof getTVDetails>>).number_of_episodes,
            tagline: (details as Awaited<ReturnType<typeof getTVDetails>>).tagline,
            genres: (details as Awaited<ReturnType<typeof getTVDetails>>).genres?.map((g) => g.name) ?? [],
          };
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "failed" },
      { status: 500 }
    );
  }
}
