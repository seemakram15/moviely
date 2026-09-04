export default function Loading() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-16 pt-24 sm:px-8 sm:pt-28">
      {/* Back button */}
      <div className="h-9 w-24 animate-pulse rounded-full bg-white/5" />
      {/* Title */}
      <div className="mt-6 h-10 w-40 animate-pulse rounded-lg bg-white/[0.06] sm:h-12 sm:w-52" />
      <div className="mt-2 h-4 w-64 animate-pulse rounded bg-white/[0.03]" />

      {/* Filter card */}
      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-4 h-4 w-24 animate-pulse rounded bg-white/[0.06]" />
        <div className="mb-4 h-11 animate-pulse rounded-lg bg-white/[0.04]" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i}>
              <div className="mb-1.5 h-2.5 w-16 animate-pulse rounded bg-white/[0.04]" />
              <div className="h-10 animate-pulse rounded-lg bg-white/[0.04]" />
            </div>
          ))}
        </div>
      </div>

      {/* Result count */}
      <div className="mt-8 flex items-baseline justify-between">
        <div className="h-4 w-32 animate-pulse rounded bg-white/[0.05]" />
        <div className="h-3 w-24 animate-pulse rounded bg-white/[0.03]" />
      </div>

      {/* Grid */}
      <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
        {Array.from({ length: 21 }).map((_, i) => (
          <div key={i}>
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-neutral-900">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
            </div>
            <div className="mt-2 h-3 w-3/4 rounded bg-neutral-900" />
            <div className="mt-1 h-2 w-1/3 rounded bg-neutral-900" />
          </div>
        ))}
      </div>
    </div>
  );
}
