import { ImageResponse } from "next/og";

// App-router favicon convention — generates favicon.ico/png equivalents
// from the same brand mark used in Logo.tsx (kept in sync by hand since
// satori can't import the DOM svg component directly).
export const size = { width: 40, height: 40 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <svg width={40} height={40} viewBox="0 0 40 40" fill="none">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#ef4444" />
            <stop offset="1" stopColor="#f97316" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="10" fill="url(#g)" />
        <path
          d="M9 29V12l11 11 11-11v17"
          stroke="white"
          strokeWidth={4.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="31" cy="29" r="7.5" fill="white" />
        <path d="M28.5 25.3v7.4l6.5-3.7-6.5-3.7Z" fill="url(#g)" />
      </svg>
    ),
    { ...size }
  );
}
