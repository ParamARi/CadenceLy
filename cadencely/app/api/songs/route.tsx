import { NextResponse } from "next/server";

/** Set in Azure / .env as GETSONGBPM_API_KEY (avoid hyphens in env var names). */
const GETSONG_API_KEY = process.env.GETSONGBPM_API_KEY;
const GETSONG_BASE_URL = "https://api.getsong.co/search/";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const songName = searchParams.get("songName");
  const typeParam = searchParams.get("type");
  const searchType = typeParam === "artist" ? "artist" : "song";

  if (!songName) {
    return NextResponse.json(
      { error: "Song name is required" },
      { status: 400 }
    );
  }

  if (!GETSONG_API_KEY) {
    console.error("Missing GETSONG_API_KEY in environment");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  try {
    const url = `${GETSONG_BASE_URL}?type=${encodeURIComponent(
      searchType
    )}&lookup=${encodeURIComponent(songName)}&api_key=${GETSONG_API_KEY}`;

    console.log(url);
    const response = await fetch(url, {
      headers: {
        // The curl example includes a Cookie header; it's not needed for API key auth,
        // so we omit it here.
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        "GetSong API error:",
        response.status,
        response.statusText
      );
      return NextResponse.json(
        { error: "Failed to fetch song details" },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error calling GetSong API:", error);
    return NextResponse.json(
      { error: "Failed to fetch song details" },
      { status: 500 }
    );
  }
}