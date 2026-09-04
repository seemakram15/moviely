import { ShimmerHero, ShimmerRow } from "@/components/Skeleton";

// Landing loading state — mirrors the real page so users don't see a
// suddenly-different layout arrive.
export default function Loading() {
  return (
    <div>
      <ShimmerHero />
      <div className="mx-auto -mt-14 max-w-[1600px] pb-8">
        <ShimmerRow title="🔥 Trending This Week" />
        <ShimmerRow title="🎬 Now Playing" />
        <ShimmerRow title="⭐ Popular Movies" />
        <ShimmerRow title="📺 Popular TV Shows" />
      </div>
    </div>
  );
}
