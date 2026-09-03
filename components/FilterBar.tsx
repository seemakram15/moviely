"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { REGIONS, GENRES, SORT_OPTIONS } from "@/lib/tmdb";

const REGION_KEYS = Object.keys(REGIONS) as (keyof typeof REGIONS)[];
const GENRE_KEYS = Object.keys(GENRES) as (keyof typeof GENRES)[];
const SORT_KEYS = Object.keys(SORT_OPTIONS) as (keyof typeof SORT_OPTIONS)[];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1949 }, (_, i) => CURRENT_YEAR - i);

function labelize(k: string) {
  return k.charAt(0).toUpperCase() + k.slice(1);
}

export default function FilterBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const kind = params.get("type") === "tv" ? "tv" : "movie";
  const region = params.get("region") ?? "";
  const genre = params.get("genre") ?? "";
  const sort = params.get("sort") ?? "popularity.desc";
  const year = params.get("year") ?? "";

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    // Reset to page 1 on any filter change
    next.delete("page");
    for (const [k, v] of Object.entries(patch)) {
      if (v === "" || v === undefined) next.delete(k);
      else next.set(k, v);
    }
    startTransition(() => router.push(`/browse?${next.toString()}`));
  };

  const activeCount = [region, genre, year].filter(Boolean).length + (sort !== "popularity.desc" ? 1 : 0);

  const clear = () =>
    startTransition(() =>
      router.push(`/browse?type=${kind}`)
    );

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400" aria-hidden="true">
            <path d="M3 6h18M6 12h12M10 18h4" strokeLinecap="round" />
          </svg>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-300">
            Filters {activeCount > 0 && <span className="ml-1 text-red-400">({activeCount})</span>}
          </h2>
          {pending && (
            <span className="ml-2 h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-red-500" />
          )}
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={clear}
            className="text-xs font-medium text-neutral-400 hover:text-white"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Type as a pretty toggle */}
      <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-black/30 p-1">
        <button
          type="button"
          onClick={() => update({ type: "movie" })}
          className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
            kind === "movie"
              ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/25"
              : "text-neutral-300 hover:bg-white/5"
          }`}
        >
          🎬 Movies
        </button>
        <button
          type="button"
          onClick={() => update({ type: "tv" })}
          className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
            kind === "tv"
              ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/25"
              : "text-neutral-300 hover:bg-white/5"
          }`}
        >
          📺 TV Shows
        </button>
      </div>

      {/* Dropdowns */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          label="Region / Language"
          value={region}
          onChange={(v) => update({ region: v })}
          options={[["", "All Regions"], ...REGION_KEYS.map((k) => [k, REGIONS[k].label])] as [string, string][]}
        />
        <Select
          label="Genre"
          value={genre}
          onChange={(v) => update({ genre: v })}
          options={[["", "All Genres"], ...GENRE_KEYS.map((k) => [k, labelize(k === "scifi" ? "Sci-Fi" : k)])] as [string, string][]}
        />
        <Select
          label="Year"
          value={year}
          onChange={(v) => update({ year: v })}
          options={[["", "Any Year"], ...YEARS.map((y) => [String(y), String(y)])] as [string, string][]}
        />
        <Select
          label="Sort By"
          value={sort}
          onChange={(v) => update({ sort: v })}
          options={SORT_KEYS.map((k) => [k, SORT_OPTIONS[k]]) as [string, string][]}
        />
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
        {label}
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full cursor-pointer appearance-none rounded-lg border border-white/10 bg-black/40 py-2.5 pl-3 pr-9 text-sm text-white transition hover:border-white/25 focus:border-red-500/60 focus:outline-none"
        >
          {options.map(([v, l]) => (
            <option key={v} value={v} className="bg-neutral-900">
              {l}
            </option>
          ))}
        </select>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </label>
  );
}
