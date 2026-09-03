import { ShimmerHero, ShimmerRow } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div>
      <ShimmerHero />
      <div className="mx-auto max-w-[1600px]">
        <ShimmerRow title="Trending This Week" />
        <ShimmerRow title="Now Playing" />
        <ShimmerRow title="Popular Movies" />
      </div>
    </div>
  );
}
