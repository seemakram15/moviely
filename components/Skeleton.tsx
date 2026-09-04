export function ShimmerCard() {
  return (
    <div className="w-[128px] shrink-0 sm:w-[160px] md:w-[200px]">
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-neutral-900">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
      </div>
      <div className="mt-2 h-3 w-3/4 overflow-hidden rounded bg-neutral-900">
        <div className="h-full -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
      </div>
      <div className="mt-1 h-2 w-1/3 rounded bg-neutral-900" />
    </div>
  );
}

export function ShimmerRow({ title }: { title: string }) {
  return (
    <section className="py-6 md:py-8">
      <div className="mb-3 flex items-center justify-between px-4 sm:px-8">
        <h2 className="text-lg font-bold text-white sm:text-2xl">{title}</h2>
        <span className="text-xs text-neutral-600">Loading…</span>
      </div>
      <div className="scrollbar-hide flex gap-3 overflow-x-hidden px-4 pb-4 pt-2 sm:gap-4 sm:px-8 md:pb-16">
        {Array.from({ length: 8 }).map((_, i) => (
          <ShimmerCard key={i} />
        ))}
      </div>
    </section>
  );
}

export function ShimmerHero() {
  return (
    <section className="relative h-[calc(100svh-3.5rem)] min-h-[440px] w-full overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-950 to-black sm:h-[85dvh] sm:min-h-[560px]">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2.4s_infinite] bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
      <div className="relative z-10 mx-auto flex h-full max-w-[1600px] flex-col justify-end px-4 pb-16 pt-20 sm:px-8 sm:pb-28 sm:pt-32">
        <div className="h-6 w-40 rounded-full bg-white/5" />
        <div className="mt-4 h-10 w-3/4 max-w-lg rounded-lg bg-white/[0.08] sm:h-14" />
        <div className="mt-4 h-4 w-1/3 max-w-xs rounded bg-white/5" />
        <div className="mt-4 h-4 w-full max-w-xl rounded bg-white/[0.04]" />
        <div className="mt-2 h-4 w-2/3 max-w-lg rounded bg-white/[0.04]" />
        <div className="mt-6 flex gap-3">
          <div className="h-12 w-32 rounded-lg bg-white/[0.08]" />
          <div className="h-12 w-32 rounded-lg bg-white/[0.04]" />
        </div>
      </div>
    </section>
  );
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-red-500" />
      <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">{label}</p>
    </div>
  );
}
