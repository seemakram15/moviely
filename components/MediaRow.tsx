import MediaCard from "./MediaCard";
import type { MediaItem } from "@/lib/tmdb";

export default function MediaRow({
  title,
  items,
}: {
  title: string;
  items: MediaItem[];
}) {
  if (!items?.length) return null;
  return (
    <section className="py-6 md:py-8">
      <div className="mb-3 flex items-center justify-between px-4 sm:px-8">
        <h2 className="text-lg font-bold text-white sm:text-2xl">{title}</h2>
        <span className="text-xs text-neutral-500">{items.length} titles</span>
      </div>
      <div className="scrollbar-hide flex gap-3 overflow-x-auto overflow-y-visible px-4 pb-4 pt-2 sm:gap-4 sm:px-8 md:pb-16">
        {items.map((item, i) => (
          // First 6 posters per rail load eagerly — those are visible before
          // any horizontal scroll on every viewport.
          <MediaCard key={`${item.media_type}-${item.id}`} item={item} eager={i < 6} />
        ))}
      </div>
    </section>
  );
}
