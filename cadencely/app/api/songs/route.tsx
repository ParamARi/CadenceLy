import { NextResponse } from "next/server";

import { SongDetailed } from "ytmusic-api";
import ytmClient from "@/lib/ytmClient";
 
export async function GET(request: Request) {

  const { searchParams } = new URL(request.url);
  const songName = searchParams.get("songName");
  if (!songName) {
    return NextResponse.json({ error: "Song name is required" }, { status: 400 });
  }
  try {
    if (!songName || typeof songName !== "string") {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 });
    }
    const songDetail = await ytmClient.fetchSongDetail(songName);
    return NextResponse.json(songDetail, { status: 200 });
  } catch (error) {
    console.error("Error fetching song details:", error);
    return NextResponse.json({ error: "Failed to fetch song details" }, { status: 500 });
  }
}