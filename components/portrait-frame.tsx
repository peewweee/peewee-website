"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import {
  GildingDefs,
  LivingPhoto,
  rrect,
  useFrameIds,
} from "@/components/frame-internals";

/**
 * PortraitFrame — the enchanted Hogwarts-style "moving portrait" for the hero.
 *
 * The frame is an antique gilded Baroque/Rococo carving drawn entirely as SVG
 * (see OrnateFrame) so it scales cleanly at any size. It never moves; the photo
 * behind its opening is quietly alive (see LivingPhoto): a slow breathing zoom,
 * a very slight drift/sway, an occasional sheen, and pointer parallax — plus a
 * faint candlelight flicker on the outer glow.
 *
 * Reduced motion → every animation is disabled and parallax never binds,
 * leaving a clean, static framed photo.
 *
 * For the thinner, crest-less gallery frames see photo-frame.tsx.
 */

/* ---------------------------------------------------------------------------
   Frame geometry — one source of truth shared by the SVG artwork and the CSS
   photo window, so the opening and the photo always line up exactly.

   viewBox 1000×1500. Outer rail 60,280 → 940,1340 (880×1060). The moulding is
   80 thick (9.1% of the frame width) in three steps: raised rail (32) → cove
   (32) → flat inner lip (16), leaving a 720×900 opening — exactly 4:5.
   --------------------------------------------------------------------------- */
const VB_W = 1000;
const VB_H = 1500;
/** Inner opening (the photo window), in viewBox units. */
const OPEN = { x: 140, y: 360, w: 720, h: 900 };
/** The photo window as CSS percentages of the SVG box. */
const WINDOW_STYLE: React.CSSProperties = {
  left: `${(OPEN.x / VB_W) * 100}%`,
  top: `${(OPEN.y / VB_H) * 100}%`,
  width: `${(OPEN.w / VB_W) * 100}%`,
  height: `${(OPEN.h / VB_H) * 100}%`,
};

export interface PortraitFrameProps {
  src: string;
  alt: string;
  className?: string;
  /**
   * Passed to next/image. The photo window is 72% of the frame's width, and the
   * overscan (1.06) plus the breathing zoom (1.04) magnify it ~10% further — so
   * these allow for the zoomed extent rather than the resting width.
   */
  sizes?: string;
  priority?: boolean;
}

export function PortraitFrame({
  src,
  alt,
  className,
  sizes = "(min-width: 1024px) 384px, 256px",
  priority = false,
}: PortraitFrameProps) {
  const frameRef = React.useRef<HTMLElement>(null);

  return (
    <figure ref={frameRef} className={cn("relative m-0 w-full", className)}>
      {/* Candlelit halo — sits behind the frame and flickers like a wall sconce.
          Uses the site's own glow token so house theming flows through. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[8%] -z-10 animate-candle rounded-[40%] bg-[radial-gradient(closest-side,rgba(var(--accent-glow),0.34),transparent_76%)] blur-2xl motion-reduce:animate-none"
      />

      {/* The SVG box. The photo sits in the opening; the carving draws on top,
          so the inner lip overlaps the photo's edge like a real rebate. */}
      <div className="relative w-full" style={{ aspectRatio: `${VB_W} / ${VB_H}` }}>
        <LivingPhoto
          frameRef={frameRef}
          src={src}
          alt={alt}
          sizes={sizes}
          priority={priority}
          className="rounded-[1%]"
          style={WINDOW_STYLE}
        />
        <OrnateFrame />
      </div>
    </figure>
  );
}

/* ===========================================================================
   OrnateFrame — the gilded Baroque carving.

   Every symmetric ornament is authored ONCE as a half (or as a single corner)
   in <defs>, then mirrored with scale(-1,1) / scale(1,-1) via <use>, so the
   left and right sides are guaranteed identical rather than hand-matched.

   Mirror maths: the frame's horizontal centre is x=500 → translate(1000,0)
   scale(-1,1). Its vertical centre is y=810 → translate(0,1620) scale(1,-1).
   =========================================================================== */

// The four concentric outlines of the moulding profile.
const R_OUT = rrect(60, 280, 880, 1060, 30); // outer edge
const R_RAIL = rrect(92, 312, 816, 996, 24); // rail → cove
const R_COVE = rrect(124, 344, 752, 932, 18); // cove → lip
const R_OPEN = rrect(OPEN.x, OPEN.y, OPEN.w, OPEN.h, 12); // the opening

function OrnateFrame() {
  const { id, url } = useFrameIds();

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <GildingDefs id={id} w={VB_W} h={VB_H} />

        {/* ================= ornaments (authored once) ================= */}

        {/* Corner cartouche — drawn for the TOP-LEFT corner, reused 4×. A chunky
            acanthus mass that WRAPS the corner: its band runs along the top rail,
            turns, and continues down the side rail, sitting on top of the moulding
            the whole way so the two read as one carving. ~27% of the frame width. */}
        <g id={id("corner")} transform="translate(60,280) scale(0.85) translate(-60,-280)">
          {/* the chunky band itself — lies ON the top rail, turns the corner,
              and carries on down the side rail */}
          <path
            d="M262 288 C206 268 148 274 112 304 C76 334 58 384 60 438
               C61 472 70 498 82 516 C96 494 100 462 99 430
               C98 388 110 350 138 328 C166 306 210 296 258 306 Z"
            fill={url("orn")}
          />
          {/* volute terminals at both ends of the band */}
          <path
            d="M258 300 C288 292 312 302 316 322 C320 342 306 358 288 355"
            fill="none"
            stroke={url("orn")}
            strokeWidth="18"
            strokeLinecap="round"
          />
          <path
            d="M82 516 C90 544 116 554 134 540 C152 526 146 502 126 498"
            fill="none"
            stroke={url("orn")}
            strokeWidth="18"
            strokeLinecap="round"
          />
          {/* acanthus flaring outward, past the frame's edge */}
          <path
            d="M240 282 C254 250 288 230 322 236 C294 252 272 274 264 304 Z"
            fill={url("orn")}
          />
          <path
            d="M98 328 C66 342 42 376 40 414 C60 386 86 368 112 362 Z"
            fill={url("orn")}
          />
          {/* inner lobe reaching along the rebate toward the opening */}
          <path
            d="M176 316 C200 332 213 358 209 384 C192 361 167 346 140 342 Z"
            fill={url("orn")}
          />
          <circle cx="112" cy="336" r="15" fill={url("orn")} />
        </g>

        {/* Crest — RIGHT half only; mirrored for the left. ONE connected mass:
            the flame finial's tip is the top of a silhouette that widens down
            into a pediment and flares outward along the top rail, ending inside
            the moulding band (y 280–344) so there is no gap to the frame. The
            outer end reaches x≈876, overlapping the corner cartouche, so the
            whole top edge is continuous: corner → crest → centre → crest → corner. */}
        <g id={id("crestHalf")}>
          <path
            d="M500 26
               C524 66 542 108 542 150
               C542 182 528 206 516 228
               C558 234 596 248 624 270
               C656 294 692 308 732 316
               C770 324 798 330 818 342
               C776 342 734 338 692 334
               C628 328 562 330 500 340 Z"
            fill={url("orn")}
          />
          {/* fold down the flame, so the finial reads carved rather than flat */}
          <path
            d="M500 92 C512 122 519 150 515 176 C508 157 500 143 500 133 Z"
            fill={url("orn")}
            opacity="0.7"
          />
          {/* volute terminating the flare, lapping toward the corner */}
          <path
            d="M818 342 C844 352 868 344 872 324 C876 304 860 290 842 296"
            fill="none"
            stroke={url("orn")}
            strokeWidth="15"
            strokeLinecap="round"
          />
          {/* acanthus hanging DOWN over the top rail — the pieces that visibly
              lap the moulding and stitch crest to frame */}
          <path
            d="M646 300 C676 308 698 330 704 356 C682 342 656 334 630 332 Z"
            fill={url("orn")}
          />
          <path
            d="M556 266 C584 276 604 298 610 324 C592 310 570 302 548 300 Z"
            fill={url("orn")}
          />
          {/* leaf curling off the flame */}
          <path
            d="M534 176 C562 166 590 176 604 198 C580 194 556 202 540 218 Z"
            fill={url("orn")}
          />
          {/* palmette ribs radiating from the centre onto the rail */}
          <g fill="none" stroke={url("orn")} strokeWidth="8" strokeLinecap="round">
            <path d="M506 334 C524 314 542 290 552 262" />
            <path d="M508 338 C532 324 556 306 574 282" />
            <path d="M512 342 C544 334 576 322 602 304" />
          </g>
          <circle cx="742" cy="330" r="9" fill={url("orn")} />
        </g>

        {/* Bottom cartouche — RIGHT half; a shorter echo of the crest. Its body
            starts at y=1286, INSIDE the bottom moulding band (1260–1340), so it
            sits on the rail instead of hanging below it. */}
        <g id={id("baseHalf")}>
          <path
            d="M500 1286
               C544 1290 580 1310 604 1340
               C628 1368 656 1388 688 1398
               C652 1406 614 1400 580 1388
               C544 1374 518 1356 500 1336 Z"
            fill={url("orn")}
          />
          <path
            d="M688 1398 C712 1410 736 1404 740 1385 C744 1367 730 1354 713 1359"
            fill="none"
            stroke={url("orn")}
            strokeWidth="13"
            strokeLinecap="round"
          />
          {/* leaf lapping up onto the rail */}
          <path
            d="M556 1300 C588 1312 612 1338 622 1368 C600 1352 574 1342 548 1340 Z"
            fill={url("orn")}
          />
        </g>

        {/* Mid-side accent — LEFT rail at half height; mirrored to the right. The
            body straddles the side moulding (x 60–140) rather than sitting beside
            it, with a leaf breaking outward past the frame's edge. */}
        <g id={id("sideHalf")}>
          <path
            d="M126 726
               C96 744 74 782 70 826
               C66 868 82 902 104 922
               C114 898 112 870 108 840
               C104 806 112 776 134 756 Z"
            fill={url("orn")}
          />
          <path
            d="M126 726 C140 719 150 730 148 745 C146 758 135 764 126 760"
            fill="none"
            stroke={url("orn")}
            strokeWidth="13"
            strokeLinecap="round"
          />
          <path
            d="M104 922 C112 944 134 951 146 938 C158 925 150 905 134 902"
            fill="none"
            stroke={url("orn")}
            strokeWidth="13"
            strokeLinecap="round"
          />
          <path
            d="M74 774 C50 790 38 820 42 850 C54 828 70 814 88 808 Z"
            fill={url("orn")}
          />
          <circle cx="100" cy="822" r="13" fill={url("orn")} />
        </g>
      </defs>

      {/* ================= assembly ================= */}
      <g filter={url("lift")}>
        {/* The moulding band first: raised rail → cove → flat inner lip. */}
        <g filter={url("carve")}>
          <path d={`${R_OUT} ${R_RAIL}`} fillRule="evenodd" fill={url("rail")} />
          <path d={`${R_RAIL} ${R_COVE}`} fillRule="evenodd" fill={url("cove")} />
          <path d={`${R_COVE} ${R_OPEN}`} fillRule="evenodd" fill={url("lip")} />
        </g>

        {/* Every ornament sits ON the moulding, each one's base reaching into the
            rail band, so the carving and the frame read as a single piece. */}
        <g filter={url("carve")}>
          <use href={`#${id("crestHalf")}`} />
          <use href={`#${id("crestHalf")}`} transform="translate(1000,0) scale(-1,1)" />
          {/* cabochon pinning the crest to the centre of the top rail */}
          <circle cx="500" cy="318" r="17" fill={url("orn")} />

          <use href={`#${id("baseHalf")}`} />
          <use href={`#${id("baseHalf")}`} transform="translate(1000,0) scale(-1,1)" />
          {/* pendant drop — symmetric about the centre line by construction, hung
              off a boss that overlaps the cartouche so it isn't left floating */}
          <circle cx="500" cy="1356" r="20" fill={url("orn")} />
          <path
            d="M500 1450 C482 1432 474 1410 483 1392 C490 1378 510 1378 517 1392
               C526 1410 518 1432 500 1450 Z"
            fill={url("orn")}
          />

          <use href={`#${id("sideHalf")}`} />
          <use href={`#${id("sideHalf")}`} transform="translate(1000,0) scale(-1,1)" />

          <use href={`#${id("corner")}`} />
          <use href={`#${id("corner")}`} transform="translate(1000,0) scale(-1,1)" />
          <use href={`#${id("corner")}`} transform="translate(0,1620) scale(1,-1)" />
          <use href={`#${id("corner")}`} transform="translate(1000,1620) scale(-1,-1)" />
        </g>

        {/* Age: speckle + a darker bloom pooling in the hollows. */}
        <path
          d={`${R_OUT} ${R_OPEN}`}
          fillRule="evenodd"
          filter={url("patina")}
          opacity="0.16"
        />
        <path
          d={`${R_RAIL} ${R_COVE}`}
          fillRule="evenodd"
          fill={url("patinaTint")}
          opacity="0.5"
        />
      </g>
    </svg>
  );
}
