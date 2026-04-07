"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { computeTapBpm } from "@/lib/bpm/tapBpm";

export type UseTapBpmOptions = {
  /** When false, Space does not register taps (e.g. while typing in an input). */
  enabled?: boolean;
};

export function useTapBpm(options: UseTapBpmOptions = {}) {
  const { enabled = true } = options;
  const [timestampsMs, setTimestampsMs] = useState<number[]>([]);

  const registerTap = useCallback(() => {
    setTimestampsMs((prev) => [...prev, performance.now()]);
  }, []);

  const reset = useCallback(() => {
    setTimestampsMs([]);
  }, []);

  const { bpm, tapCount } = useMemo(
    () => computeTapBpm(timestampsMs),
    [timestampsMs]
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.key !== " ") {
        return;
      }
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      registerTap();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, registerTap]);

  return {
    bpm,
    tapCount,
    timestampsMs,
    registerTap,
    reset,
  };
}
