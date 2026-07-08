"use client";

import { MusicToggle } from "./music-toggle";
import { WandCursor } from "./wand-cursor";

/**
 * Atmosphere — global, lightweight controls cluster (bottom-left) plus the wand
 * cursor overlay. Music defaults OFF; the wand is desktop-only / reduced-motion
 * aware. Mounted once in the root layout.
 */
export function Atmosphere() {
  return (
    <>
      <WandCursor />
      <div className="fixed bottom-5 left-5 z-30 flex flex-col gap-2">
        <MusicToggle />
      </div>
    </>
  );
}
