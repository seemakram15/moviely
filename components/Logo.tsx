// Brand mark: a play button cut into an "M" silhouette, with film-strip
// perforations along the top edge. Plain function component (no hooks/DOM
// APIs) so it can also be rendered by satori in opengraph-image/icon routes.
export default function Logo({ size = 32 }: { size?: number }) {
  const id = "moviely-logo-grad";
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ef4444" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill={`url(#${id})`} />
      {/* film-strip perforations */}
      <circle cx="8" cy="7.5" r="1.6" fill="white" fillOpacity="0.5" />
      <circle cx="16" cy="7.5" r="1.6" fill="white" fillOpacity="0.5" />
      <circle cx="24" cy="7.5" r="1.6" fill="white" fillOpacity="0.5" />
      <circle cx="32" cy="7.5" r="1.6" fill="white" fillOpacity="0.5" />
      {/* bold M */}
      <path
        d="M9 29V12l11 11 11-11v17"
        stroke="white"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* play-button accent badge */}
      <circle cx="31" cy="29" r="7.5" fill="white" />
      <path d="M28.5 25.3v7.4l6.5-3.7-6.5-3.7Z" fill={`url(#${id})`} />
    </svg>
  );
}
