"use client";

import { MusicToggle } from "./music-toggle";
import { WandCursor, WandToggle } from "./wand-cursor";

/**
 * Atmosphere — global, lightweight controls cluster (bottom-left) plus the wand
 * cursor overlay. All Phase 4 stubs: music defaults OFF, the wand is desktop-
 * only / reduced-motion aware / opt-out-able. Mounted once in the root layout.
 */
export function Atmosphere() {
  return (
    <>
      <WandCursor />
      <div className="fixed bottom-5 left-5 z-30 flex flex-col gap-2">
        <MusicToggle />
        <WandToggle />
      </div>
    </>
  );
}
