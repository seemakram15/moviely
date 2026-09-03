import Link from "next/link";
import MediaCard from "@/components/MediaCard";
import BackButton from "@/components/BackButton";
import FilterBar from "@/components/FilterBar";
import {
  discoverPage,
  REGIONS,
  GENRES,
  type RegionKey,
  type GenreKey,
  type MediaType,
} from "@/lib/tmdb";

export const revalidate = 3600;

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function BrowsePage(props: PageProps<"/browse">) {
  const sp = await props.searchParams;
  const kind = (one(sp?.type) === "tv" ? "tv" : "movie") as MediaType;
  const region = one(sp?.region) as RegionKey | undefined;
  const genre = one(sp?.genre) as GenreKey | undefined;
  const sort = one(sp?.sort) ?? "popularity.desc";
  const year = one(sp?.year);
  const page = Math.max(1, Math.min(500, Number(one(sp?.page) ?? "1") || 1));

  const params: Record<string, string> = { sort_by: sort, page: String(page) };
  if (region && REGIONS[region]) Object.assign(params, REGIONS[region][kind]);
  if (genre && GENRES[genre]) params.with_genres = String(GENRES[genre]);
  if (year) {
    if (kind === "movie") params.primary_release_year = year;
    else params.first_air_date_year = year;
  }

  const { items, page: currentPage, totalPages, totalResults } = await discoverPage(kind, params);

  const summary = [
    region ? REGIONS[region].label : null,
    genre ? genre.charAt(0).toUpperCase() + genre.slice(1) : null,
    year || null,
  ]
    .filter(Boolean)
    .join(" · ");

  const pageUrl = (p: number) => {
    const next = new URLSearchParams(Object.entries(params).filter(([, v]) => v));
    next.set("type", kind);
    if (region) next.set("region", region);
    if (genre) next.set("genre", genre);
    next.set("page", String(p));
    // strip TMDB filter params we don't want in the URL
    next.delete("with_original_language");
    next.delete("with_origin_country");
    next.delete("with_genres");
    next.delete("sort_by");
    next.delete("primary_release_year");
    next.delete("first_air_date_year");
    if (sort !== "popularity.desc") next.set("sort", sort);
    if (year) next.set("year", year);
    return `/browse?${next.toString()}`;
  };

  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-16 pt-24 sm:px-8 sm:pt-28">
      <BackButton />
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white sm:text-5xl">Browse</h1>
          <p className="mt-2 text-neutral-400">
            Every title in TMDB, filtered your way.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <FilterBar />
      </div>

      <div className="mt-8 flex items-baseline justify-between">
        <p className="text-sm text-neutral-400">
          <span className="font-semibold text-white">{totalResults.toLocaleString()}</span> results
          {summary && <span className="text-neutral-500"> · {summary}</span>}
        </p>
        <p className="text-xs text-neutral-500">
          Page {currentPage} of {totalPages}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="mt-16 rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center">
          <p className="text-lg text-neutral-300">No matches for this combination.</p>
          <p className="mt-2 text-sm text-neutral-500">Try widening the filters above.</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
          {items.map((item) => (
            <MediaCard key={`${item.media_type}-${item.id}`} item={item} fluid />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination current={currentPage} total={totalPages} url={pageUrl} />
      )}
    </div>
  );
}

function Pagination({
  current,
  total,
  url,
}: {
  current: number;
  total: number;
  url: (p: number) => string;
}) {
  const window = 2;
  const pages: (number | "…")[] = [];
  const push = (n: number | "…") =>
    pages[pages.length - 1] !== n && pages.push(n);

  push(1);
  if (current - window > 2) push("…");
  for (let i = Math.max(2, current - window); i <= Math.min(total - 1, current + window); i++) push(i);
  if (current + window < total - 1) push("…");
  if (total > 1) push(total);

  return (
    <nav className="mt-12 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
      {current > 1 && (
        <Link
          href={url(current - 1)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-300 transition hover:border-white/25 hover:text-white"
        >
          ← Prev
        </Link>
      )}
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-2 text-neutral-500">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={url(p)}
            className={`min-w-10 rounded-lg px-3 py-2 text-center text-sm font-medium transition ${
              p === current
                ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/25"
                : "border border-white/10 bg-white/5 text-neutral-300 hover:border-white/25 hover:text-white"
            }`}
          >
            {p}
          </Link>
        )
      )}
      {current < total && (
        <Link
          href={url(current + 1)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-300 transition hover:border-white/25 hover:text-white"
        >
          Next →
        </Link>
      )}
    </nav>
  );
}
