import { ImageResponse } from "next/og";

// Generates the social preview at 1200×630 on the fly. Next.js picks it up
// as the site's OG image via the App Router's built-in convention.
export const runtime = "edge";
export const alt = "Moviely — Watch Movies & TV Shows";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background:
            "linear-gradient(135deg, #0a0a0a 0%, #1a0505 45%, #2b0a04 100%)",
          fontFamily: "system-ui, sans-serif",
          color: "white",
          position: "relative",
        }}
      >
        {/* Ambient glow blobs */}
        <div
          style={{
            position: "absolute",
            top: -180,
            right: -140,
            width: 520,
            height: 520,
            borderRadius: 9999,
            background:
              "radial-gradient(circle at center, rgba(239,68,68,0.55), rgba(239,68,68,0) 70%)",
            filter: "blur(20px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -160,
            left: -120,
            width: 460,
            height: 460,
            borderRadius: 9999,
            background:
              "radial-gradient(circle at center, rgba(249,115,22,0.45), rgba(249,115,22,0) 70%)",
            filter: "blur(20px)",
          }}
        />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 56,
              fontWeight: 900,
              background:
                "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
              boxShadow: "0 20px 40px -10px rgba(239,68,68,0.6)",
            }}
          >
            M
          </div>
          <div
            style={{
              fontSize: 68,
              fontWeight: 900,
              letterSpacing: -1.5,
              display: "flex",
            }}
          >
            Moviely
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            maxWidth: 900,
          }}
        >
          <div
            style={{
              fontSize: 88,
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: -2,
              display: "flex",
              flexWrap: "wrap",
            }}
          >
            Watch every movie{" "}
            <span
              style={{
                background:
                  "linear-gradient(90deg, #ef4444 0%, #f97316 100%)",
                backgroundClip: "text",
                color: "transparent",
                marginLeft: 20,
              }}
            >
              & show.
            </span>
          </div>
          <div
            style={{
              fontSize: 30,
              color: "#d4d4d8",
              lineHeight: 1.4,
              display: "flex",
              flexWrap: "wrap",
            }}
          >
            Bollywood · Hollywood · K-Drama · Anime · Turkish · and everything in between.
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 24,
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: "#a1a1aa",
                display: "flex",
              }}
            >
              Built by
            </div>
            <div
              style={{
                fontSize: 34,
                fontWeight: 800,
                letterSpacing: -0.5,
                display: "flex",
              }}
            >
              Waseem Akram
            </div>
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#f97316",
              display: "flex",
            }}
          >
            moviely.qzz.io
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
