import type { BpmFeedbackClientPayload } from "@/lib/bpm/bpmFeedbackApi";

export type SubmitBpmFeedbackResult =
  | { ok: true; status: number }
  | { ok: false; status?: number; error: string };

/**
 * POST to Next `/api/feedback/bpm`, which validates and proxies to
 * Express when `FEEDBACK_API_URL` points at your Express POST URL (see `feedbackUpstream.ts`).
 * Failures are logged; localStorage still holds the vote from the caller.
 */
export async function submitBpmFeedback(
  body: BpmFeedbackClientPayload
): Promise<SubmitBpmFeedbackResult> {
  try {
    const payload = {
      ...body,
      clientSentAt: body.clientSentAt ?? new Date().toISOString(),
    };
    console.log("payload", payload);
    const res = await fetch("/api/feedback/bpm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await res.text().catch(() => "");

    if (!res.ok) {
      let message = text.trim() || `HTTP ${res.status}`;
      try {
        const j = JSON.parse(text) as { error?: string };
        if (typeof j?.error === "string" && j.error) message = j.error;
      } catch {
        /* use raw text */
      }
      console.warn("[bpm-feedback] API returned", res.status, text);
      return { ok: false, status: res.status, error: message };
    }

    return { ok: true, status: res.status };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.warn("[bpm-feedback] submit failed", e);
    return { ok: false, error };
  }
}
