import { NextResponse } from "next/server";
import {
  clearRuntimeYoutubeCookies,
  getYoutubeCookiesStatus,
  setRuntimeYoutubeCookiesFromRaw,
} from "@/lib/bpm/youtubeCookies";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getYoutubeCookiesStatus());
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const raw =
      typeof body.cookies === "string"
        ? body.cookies
        : JSON.stringify(body.cookies ?? null);
    if (!raw || raw === "null") {
      return NextResponse.json(
        { error: "Provide cookies JSON in `cookies`." },
        { status: 400 }
      );
    }

    const result = setRuntimeYoutubeCookiesFromRaw(raw);
    return NextResponse.json({
      ok: true,
      ...result,
      ...getYoutubeCookiesStatus(),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to set YouTube cookies";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE() {
  clearRuntimeYoutubeCookies();
  return NextResponse.json({ ok: true, ...getYoutubeCookiesStatus() });
}
