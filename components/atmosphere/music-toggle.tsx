"use client";

import * as React from "react";
import { Music, VolumeX } from "lucide-react";

import { cn } from "@/lib/utils";
import { usePreference, usePrefersReducedMotion } from "@/lib/use-preference";

/**
 * MusicToggle — Phase 4 STUB.
 *
 * Faithful control surface: defaults OFF, remembers the preference, fully
 * keyboard-accessible, and its glow animation respects reduced-motion. The
 * actual audio (Howler.js, royalty-free track, fade in/out) is NOT wired yet.
 *
 * TODO (Phase 4):
 *  - Load a CC/royalty-free ambient track (NOT the copyrighted film score).
 *  - Start playback only on this user gesture; fade in/out; modest volume.
 *  - Keep this default-OFF + persisted-preference contract intact.
 */
export function MusicToggle({ className }: { className?: string }) {
  const [on, setOn, mounted] = usePreference("wiz:music", false);
  const reduced = usePrefersReducedMotion();

  // Avoid SSR/client mismatch for the pressed state.
  const pressed = mounted ? on : false;

  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={pressed ? "Turn background music off" : "Turn background music on"}
      title={pressed ? "Music: on (stub — no audio yet)" : "Music: off"}
      onClick={() => setOn(!on)}
      className={cn(
        "grid size-11 place-items-center rounded-pill border border-border-strong bg-surface text-foreground-muted transition-all hover:text-accent-text hover:shadow-glow focus-visible:shadow-focus focus-visible:outline-none",
        pressed && "border-accent text-accent-text shadow-glow",
        pressed && !reduced && "animate-candle",
        className,
      )}
    >
      {pressed ? <Music className="size-5" /> : <VolumeX className="size-5" />}
    </button>
  );
}
