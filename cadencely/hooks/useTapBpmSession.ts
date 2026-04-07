import { useCallback, useState } from "react";
import type { TapBpmSession } from "@/components/TapBpmModal";

/**
 * Shared open/close state for the tap-BPM modal across results tables.
 */
export function useTapBpmSession() {
  const [session, setSession] = useState<TapBpmSession | null>(null);
  const open = useCallback((s: TapBpmSession) => setSession(s), []);
  const close = useCallback(() => setSession(null), []);
  return { session, open, close };
}
