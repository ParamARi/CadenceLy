import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  parseBpmFeedbackPostBody,
  type BpmFeedbackPostBody,
} from "@/lib/bpm/bpmFeedbackApi";
import { getBpmFeedbackUpstreamUrl } from "@/lib/bpm/feedbackUpstream";

const FORWARD_TIMEOUT_MS = 10_000;

/**
 * Validates the body, then either forwards to Express (`FEEDBACK_API_URL`)
 * or records a stub response when no upstream is configured.
 */
export function GET() {
  return NextResponse.json({
    ok: true,
    path: "/api/feedback/bpm",
    forwardingToUpstream: Boolean(getBpmFeedbackUpstreamUrl()),
  });
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = parseBpmFeedbackPostBody(json);
  if (!parsed.ok) {
    return NextResponse.json(
      { ok: false, error: parsed.message },
      { status: 400 }
    );
  }

  const payload = {
    ...parsed.body,
    clientSentAt:
      parsed.body.clientSentAt ?? new Date().toISOString(),
  };

  const upstreamUrl = getBpmFeedbackUpstreamUrl();
  if (upstreamUrl) {
    try {
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), FORWARD_TIMEOUT_MS);
      const upstreamRes = await fetch(upstreamUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: ac.signal,
      });
      clearTimeout(t);

      const text = await upstreamRes.text();
      let body: unknown = {};
      if (text) {
        try {
          body = JSON.parse(text) as unknown;
        } catch {
          body = { ok: upstreamRes.ok, raw: text };
        }
      }

      if (upstreamRes.status === 404) {
        console.error(
          "[api/feedback/bpm] upstream returned 404 — fix FEEDBACK_API_URL (full Express POST URL):",
          upstreamUrl
        );
        return NextResponse.json(
          {
            ok: false,
            error:
              "Feedback upstream returned 404. Set FEEDBACK_API_URL in .env.local to the exact POST URL your Express app exposes (path is often different from Next, e.g. /feedback instead of /api/feedback/bpm).",
          },
          { status: 502 }
        );
      }

      return NextResponse.json(body, { status: upstreamRes.status });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Upstream request failed";
      console.error("[api/feedback/bpm] upstream error:", upstreamUrl, err);
      return NextResponse.json(
        { ok: false, error: "Feedback service unavailable", detail: message },
        { status: 502 }
      );
    }
  }

  const id = randomUUID();
  logFeedbackStub(id, parsed.body);

  return NextResponse.json(
    {
      ok: true,
      id,
      message: "Feedback received (stub — set FEEDBACK_API_URL to persist)",
    },
    { status: 201 }
  );
}

function logFeedbackStub(id: string, body: BpmFeedbackPostBody) {
  console.info("[api/feedback/bpm] stub", id, {
    vote: body.vote,
    source: body.source,
    rowIndex: body.rowIndex,
    reportedTempo: body.reportedTempo,
    usedParsedFallback: body.usedParsedFallback,
    playlistId: body.playlistId,
    artistName: body.artistName,
    videoId: body.videoId,
    suggestedArtist: body.suggestedArtist,
    suggestedSong: body.suggestedSong,
  });
}
