"use client";

import * as React from "react";

/**
 * Tiny localStorage-backed boolean preference, synced across components in the
 * same tab via a custom event (and across tabs via the native `storage` event).
 * Used by the atmosphere toggles (music, wand cursor).
 *
 * SSR-safe: returns `defaultValue` until mounted, so the server and first client
 * render agree (avoids hydration mismatch).
 */
export type PreferenceKey = "wiz:music" | "wiz:wand" | "wiz:castle3d";

const EVENT = "wiz:preference-change";

function read(key: PreferenceKey, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  return raw === null ? fallback : raw === "true";
}

export function usePreference(
  key: PreferenceKey,
  defaultValue: boolean,
): [boolean, (next: boolean) => void, boolean] {
  const [mounted, setMounted] = React.useState(false);
  const [value, setValue] = React.useState(defaultValue);

  React.useEffect(() => {
    setMounted(true);
    setValue(read(key, defaultValue));

    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<{ key: PreferenceKey }>).detail;
      if (!detail || detail.key === key) setValue(read(key, defaultValue));
    };
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [key, defaultValue]);

  const set = React.useCallback(
    (next: boolean) => {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(key, String(next));
      window.dispatchEvent(new CustomEvent(EVENT, { detail: { key } }));
      setValue(next);
    },
    [key],
  );

  return [value, set, mounted];
}

/** Whether the visitor prefers reduced motion (live). SSR-safe. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/** Whether the device is a touch/coarse pointer (no hover). SSR-safe. */
export function useIsTouchDevice(): boolean {
  const [touch, setTouch] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(hover: none), (pointer: coarse)");
    setTouch(mq.matches);
    const onChange = () => setTouch(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return touch;
}

/** Whether the browser can create a WebGL context. SSR-safe (false until mounted). */
export function useHasWebGL(): boolean {
  const [ok, setOk] = React.useState(false);
  React.useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl");
      setOk(!!gl);
      // Release the detection context immediately so it never counts against the
      // browser's WebGL context limit (the real Canvas creates its own).
      (gl as WebGLRenderingContext | null)
        ?.getExtension("WEBGL_lose_context")
        ?.loseContext();
    } catch {
      setOk(false);
    }
  }, []);
  return ok;
}

/**
 * Decide whether to render the 3D castle. It's the only experience — there is no
 * 2D toggle — so the just safety nets are WebGL availability and reduced-motion.
 * (Both start false until mounted, keeping SSR and the first client render in
 * sync; the silhouette stands in until then or if 3D can't run.)
 */
export function useCastle3D(): { show3D: boolean } {
  const reduced = usePrefersReducedMotion();
  const webgl = useHasWebGL();
  return { show3D: webgl && !reduced };
}
