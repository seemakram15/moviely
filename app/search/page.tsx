import MediaCard from "@/components/MediaCard";
import BackButton from "@/components/BackButton";
import { searchMulti } from "@/lib/tmdb";

export const dynamic = "force-dynamic";

export default async function SearchPage(props: PageProps<"/search">) {
  const sp = await props.searchParams;
  const raw = sp?.q;
  const q = Array.isArray(raw) ? raw[0] : raw ?? "";

  let results: Awaited<ReturnType<typeof searchMulti>> = [];
  let error: string | null = null;
  if (q) {
    try {
      results = await searchMulti(q);
    } catch (e) {
      error = e instanceof Error ? e.message : "search failed";
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 sm:pt-28">
      <BackButton />
      <h1 className="mt-6 text-2xl font-bold text-white sm:text-4xl">
        {q ? <>Results for &ldquo;<span className="text-red-400">{q}</span>&rdquo;</> : "Search"}
      </h1>
      {q && !error && (
        <p className="mt-2 text-sm text-neutral-400">{results.length} matches</p>
      )}
      {!q && (
        <p className="mt-2 text-neutral-400">
          Try searching from the bar above — e.g. &ldquo;Dune&rdquo; or &ldquo;Severance&rdquo;.
        </p>
      )}
      {error && <p className="mt-4 text-red-400">{error}</p>}
      {q && !error && results.length === 0 && (
        <p className="mt-4 text-neutral-400">No matches. Try a different title.</p>
      )}
      {results.length > 0 && (
        <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
          {results.map((item) => (
            <MediaCard key={`${item.media_type}-${item.id}`} item={item} fluid />
          ))}
        </div>
      )}
    </div>
  );
}
