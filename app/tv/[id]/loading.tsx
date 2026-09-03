import { Spinner } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <div className="hidden aspect-[2/3] animate-pulse rounded-xl bg-neutral-900 lg:block" />
        <div>
          <div className="h-10 w-2/3 animate-pulse rounded-lg bg-neutral-900" />
          <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-neutral-900" />
          <div className="mt-6 h-4 w-full animate-pulse rounded bg-neutral-900" />
          <div className="mt-8 aspect-video animate-pulse rounded-2xl bg-neutral-900" />
          <Spinner label="Loading show…" />
        </div>
      </div>
    </div>
  );
}
