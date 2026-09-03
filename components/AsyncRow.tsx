import { Suspense } from "react";
import MediaRow from "./MediaRow";
import { ShimmerRow } from "./Skeleton";
import type { MediaItem } from "@/lib/tmdb";

async function RowInner({
  title,
  fetcher,
}: {
  title: string;
  fetcher: () => Promise<MediaItem[]>;
}) {
  let items: MediaItem[] = [];
  try {
    items = await fetcher();
  } catch {
    /* silently skip a failing rail so one bad category doesn't kill the page */
  }
  return <MediaRow title={title} items={items} />;
}

/** Server-side streaming row: renders a shimmer instantly, resolves in the background. */
export default function AsyncRow({
  title,
  fetcher,
}: {
  title: string;
  fetcher: () => Promise<MediaItem[]>;
}) {
  return (
    <Suspense fallback={<ShimmerRow title={title} />}>
      <RowInner title={title} fetcher={fetcher} />
    </Suspense>
  );
}
