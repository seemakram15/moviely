import { ImageResponse } from "next/og";

// Renders the Moviely brand mark at any square size.
// Kept in sync with Logo.tsx and app/icon.tsx by hand.
export function moviellyIcon(size: number): ImageResponse {
  const r = (v: number) => (v / 40) * size; // scale from 40px design grid

  return new ImageResponse(
    (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#ef4444" />
            <stop offset="1" stopColor="#f97316" />
          </linearGradient>
        </defs>
        {/* background */}
        <rect width="40" height="40" rx="10" fill="url(#g)" />
        {/* film-strip perforations */}
        <circle cx="8"  cy="7.5" r="1.6" fill="white" fill-opacity="0.5" />
        <circle cx="16" cy="7.5" r="1.6" fill="white" fill-opacity="0.5" />
        <circle cx="24" cy="7.5" r="1.6" fill="white" fill-opacity="0.5" />
        <circle cx="32" cy="7.5" r="1.6" fill="white" fill-opacity="0.5" />
        {/* M */}
        <path
          d="M9 29V12l11 11 11-11v17"
          stroke="white"
          stroke-width="4.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          fill="none"
        />
        {/* play badge */}
        <circle cx="31" cy="29" r="7.5" fill="white" />
        <path d="M28.5 25.3v7.4l6.5-3.7-6.5-3.7Z" fill="url(#g)" />
      </svg>
    ),
    { width: size, height: size }
  );
}
