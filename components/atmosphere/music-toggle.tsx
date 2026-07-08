"use client";

import * as React from "react";
import { Music, VolumeX } from "lucide-react";

import { cn } from "@/lib/utils";
import { usePreference, usePrefersReducedMotion } from "@/lib/use-preference";

/**
 * Background ambience. Drop a royalty-free / Creative Commons "wizarding" track
 * at `public/audio/ambience.mp3` (NOT the copyrighted film score). To use a
 * different name/format, change TRACK_SRC. mp3 plays in every current browser.
 */
const TRACK_SRC = "/audio/ambience.mp3";
const TARGET_VOLUME = 0.35; // modest
const FADE_MS = 1000;

/**
 * MusicToggle — a looping ambient track with fade in/out.
 *
 * Defaults ON, but browsers block autoplay until a gesture, so playback fades in
 * on the visitor's first click/keypress (not literally on load). Remembers the
 * preference (a visitor who turns it off stays off), keyboard-accessible, and its
 * glow animation respects reduced-motion (the audio itself does not — sound isn't
 * motion). If the file is missing, the toggle still works silently.
 */
export function MusicToggle({ className }: { className?: string }) {
  const [on, setOn, mounted] = usePreference("wiz:music", true);
  const reduced = usePrefersReducedMotion();

  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const fadeRef = React.useRef<number | null>(null);

  const getAudio = React.useCallback(() => {
    if (!audioRef.current) {
      const a = new Audio(TRACK_SRC);
      a.loop = true;
      a.preload = "auto";
      a.volume = 0;
      audioRef.current = a;
    }
    return audioRef.current;
  }, []);

  const fadeTo = React.useCallback((to: number, onDone?: () => void) => {
    const a = audioRef.current;
    if (!a) return;
    if (fadeRef.current !== null) cancelAnimationFrame(fadeRef.current);
    const from = a.volume;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / FADE_MS);
      a.volume = Math.max(0, Math.min(1, from + (to - from) * p));
      if (p < 1) {
        fadeRef.current = requestAnimationFrame(step);
      } else {
        fadeRef.current = null;
        onDone?.();
      }
    };
    fadeRef.current = requestAnimationFrame(step);
  }, []);

  const play = React.useCallback(() => {
    const a = getAudio();
    a.play()
      .then(() => fadeTo(TARGET_VOLUME))
      .catch(() => {
        /* blocked or file missing — stays silent, toggle still reflects intent */
      });
  }, [getAudio, fadeTo]);

  // Returning visitor who had music ON: browsers block autoplay on load, so
  // resume on their first interaction instead.
  React.useEffect(() => {
    if (!mounted || !on) return;
    const a = getAudio();
    if (!a.paused) return;
    const resume = () => {
      if (on) play();
      remove();
    };
    const remove = () => {
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
    };
    window.addEventListener("pointerdown", resume, { once: true });
    window.addEventListener("keydown", resume, { once: true });
    return remove;
  }, [mounted, on, getAudio, play]);

  // Stop cleanly if this ever unmounts.
  React.useEffect(() => {
    return () => {
      if (fadeRef.current !== null) cancelAnimationFrame(fadeRef.current);
      audioRef.current?.pause();
    };
  }, []);

  const toggle = () => {
    const next = !on;
    setOn(next);
    if (next) {
      play(); // called inside the click gesture, so autoplay is allowed
    } else {
      fadeTo(0, () => audioRef.current?.pause());
    }
  };

  const pressed = mounted ? on : false;

  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={pressed ? "Turn background music off" : "Turn background music on"}
      title={pressed ? "Music: on" : "Music: off"}
      onClick={toggle}
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
