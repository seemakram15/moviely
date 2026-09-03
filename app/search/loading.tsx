export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <div className="h-8 w-64 animate-pulse rounded-lg bg-neutral-900" />
      <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[2/3] w-full animate-pulse rounded-lg bg-gradient-to-br from-neutral-800 to-neutral-900" />
            <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-neutral-800" />
            <div className="mt-1 h-2 w-1/3 animate-pulse rounded bg-neutral-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
