export function ShimmerCard() {
  return (
    <div className="w-[160px] shrink-0 sm:w-[200px]">
      <div className="aspect-[2/3] animate-pulse rounded-lg bg-gradient-to-br from-neutral-800 to-neutral-900" />
      <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-neutral-800" />
      <div className="mt-1 h-2 w-1/3 animate-pulse rounded bg-neutral-800" />
    </div>
  );
}

export function ShimmerRow({ title }: { title: string }) {
  return (
    <section className="py-6">
      <h2 className="mb-3 px-4 text-lg font-bold text-white sm:px-8 sm:text-xl">
        {title}
      </h2>
      <div className="scrollbar-hide flex gap-3 overflow-x-hidden px-4 pb-2 sm:gap-4 sm:px-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <ShimmerCard key={i} />
        ))}
      </div>
    </section>
  );
}

export function ShimmerHero() {
  return (
    <section className="relative h-[85vh] min-h-[560px] w-full animate-pulse overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-950 to-black">
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
      <div className="relative z-10 mx-auto flex h-full max-w-[1600px] flex-col justify-end px-4 pb-16 sm:px-8">
        <div className="h-6 w-40 rounded-full bg-white/5" />
        <div className="mt-4 h-14 w-2/3 rounded-lg bg-white/10" />
        <div className="mt-6 h-4 w-1/2 rounded bg-white/5" />
        <div className="mt-8 flex gap-3">
          <div className="h-12 w-32 rounded-lg bg-white/10" />
          <div className="h-12 w-32 rounded-lg bg-white/5" />
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
