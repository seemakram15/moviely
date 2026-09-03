import { NextResponse } from "next/server";
import { getSeason } from "@/lib/tmdb";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tv = Number(searchParams.get("tv"));
  const season = Number(searchParams.get("season"));
  if (!tv || Number.isNaN(season)) {
    return NextResponse.json({ error: "tv and season are required" }, { status: 400 });
  }
  try {
    const data = await getSeason(tv, season);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "failed" },
      { status: 500 }
    );
  }
}
