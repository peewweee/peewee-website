"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import {
  GildingDefs,
  LivingPhoto,
  ViewableFrame,
  epath,
  rrect,
  useFrameIds,
} from "@/components/frame-internals";

/**
 * PhotoFrame — the gallery companions to the hero's PortraitFrame: the same
 * gilded Baroque carving and the same "living portrait" photo, but a THINNER
 * moulding and NO top crest. In the crest's place sits a centre cartouche, the
 * same ornament family used on the sides — so the set reads as one collection.
 *
 * Four variants, from `shape` × `orientation`:
 *   oval  + portrait   ·  rect + portrait
 *   oval  + landscape  ·  rect + landscape
 *
 * Geometry is derived from one pair of constants, so every variant keeps a 44-
 * unit moulding (≈5% of the frame's width — half the hero's 9.1%) and an
 * opening of exactly 4:5 (portrait) or 5:4 (landscape).
 *
 * Because the frame is centred in its viewBox, mirroring is uniform: horizontal
 * is translate(vbW,0) scale(-1,1), vertical is translate(0,vbH) scale(1,-1) —
 * and the four cardinal ornament anchors land on the outer edge for BOTH the
 * rectangle and the ellipse, so one accent serves every variant.
 */

export type FrameShape = "oval" | "rect";
export type FrameOrientation = "portrait" | "landscape";

/** Breathing room around the moulding for ornaments that break its outline. */
const MARGIN = 56;
/** Moulding thickness, in three steps: rail 18 → cove 16 → flat lip 10. */
const THICK = 44;

const VIEWBOX = {
  portrait: { w: 1000, h: 1200 },
  landscape: { w: 1200, h: 1000 },
} as const;

export interface PhotoFrameProps {
  src: string;
  alt: string;
  shape: FrameShape;
  orientation: FrameOrientation;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Click (or Enter/Space) opens the full, uncropped photo in a lightbox. */
  viewable?: boolean;
}

export function PhotoFrame({
  src,
  alt,
  shape,
  orientation,
  className,
  sizes = "(min-width: 1024px) 320px, 45vw",
  priority = false,
  viewable = true,
}: PhotoFrameProps) {
  const frameRef = React.useRef<HTMLElement>(null);
  const vb = VIEWBOX[orientation];

  // The opening, in viewBox units — and the same rectangle as CSS percentages,
  // so the photo window always lands exactly on it.
  const open = {
    x: MARGIN + THICK,
    y: MARGIN + THICK,
    w: vb.w - 2 * (MARGIN + THICK),
    h: vb.h - 2 * (MARGIN + THICK),
  };
  const windowStyle: React.CSSProperties = {
    left: `${(open.x / vb.w) * 100}%`,
    top: `${(open.y / vb.h) * 100}%`,
    width: `${(open.w / vb.w) * 100}%`,
    height: `${(open.h / vb.h) * 100}%`,
    // An ellipse opening just needs the window clipped to an ellipse too.
    ...(shape === "oval" ? { borderRadius: "50%" } : null),
  };

  const frame = (
    <figure ref={frameRef} className={cn("relative m-0 w-full", className)}>
      {/* Candlelit halo, flickering like a wall sconce (site glow token). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[10%] -z-10 animate-candle bg-[radial-gradient(closest-side,rgba(var(--accent-glow),0.3),transparent_75%)] blur-2xl motion-reduce:animate-none"
        style={{ borderRadius: shape === "oval" ? "50%" : "36%" }}
      />

      <div className="relative w-full" style={{ aspectRatio: `${vb.w} / ${vb.h}` }}>
        <LivingPhoto
          frameRef={frameRef}
          src={src}
          // When the frame is a button, the button carries the accessible name —
          // so the thumbnail itself is decorative and must not be announced twice.
          alt={viewable ? "" : alt}
          sizes={sizes}
          priority={priority}
          className={shape === "oval" ? undefined : "rounded-[1%]"}
          style={windowStyle}
        />
        <GiltFrame shape={shape} vbW={vb.w} vbH={vb.h} open={open} />
      </div>
    </figure>
  );

  if (!viewable) return frame;

  return (
    <ViewableFrame src={src} alt={alt}>
      {frame}
    </ViewableFrame>
  );
}

/* ===========================================================================
   GiltFrame — the carving. Thin three-step moulding plus ornaments:
     · rect → four corner cartouches + a centre cartouche top and bottom
     · oval → a centre cartouche at all four cardinal points
   =========================================================================== */

function GiltFrame({
  shape,
  vbW,
  vbH,
  open,
}: {
  shape: FrameShape;
  vbW: number;
  vbH: number;
  open: { x: number; y: number; w: number; h: number };
}) {
  const { id, url } = useFrameIds();

  const cx = vbW / 2;
  const cy = vbH / 2;
  const ow = vbW - 2 * MARGIN; // outer moulding width
  const oh = vbH - 2 * MARGIN;

  // Three concentric bands: rail (18) → cove (16) → flat lip (10).
  const outlines =
    shape === "rect"
      ? [
          rrect(MARGIN, MARGIN, ow, oh, 22),
          rrect(MARGIN + 18, MARGIN + 18, ow - 36, oh - 36, 18),
          rrect(MARGIN + 34, MARGIN + 34, ow - 68, oh - 68, 14),
          rrect(open.x, open.y, open.w, open.h, 10),
        ]
      : [
          epath(cx, cy, ow / 2, oh / 2),
          epath(cx, cy, ow / 2 - 18, oh / 2 - 18),
          epath(cx, cy, ow / 2 - 34, oh / 2 - 34),
          epath(cx, cy, open.w / 2, open.h / 2),
        ];

  // Ornament anchors sit on the outer edge at the four cardinal points — which
  // is the same place for a rectangle and an ellipse, so one accent fits both.
  const accentAt = [
    `translate(${cx},${MARGIN})`, // top
    `translate(${cx},${MARGIN}) scale(-1,1)`,
    `translate(${cx},${vbH - MARGIN}) scale(1,-1)`, // bottom
    `translate(${cx},${vbH - MARGIN}) scale(-1,-1)`,
    ...(shape === "oval"
      ? [
          `translate(${MARGIN},${cy}) rotate(-90)`, // left
          `translate(${MARGIN},${cy}) rotate(-90) scale(1,-1)`,
          `translate(${vbW - MARGIN},${cy}) rotate(90)`, // right
          `translate(${vbW - MARGIN},${cy}) rotate(90) scale(1,-1)`,
        ]
      : []),
  ];

  return (
    <svg
      viewBox={`0 0 ${vbW} ${vbH}`}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <GildingDefs id={id} w={vbW} h={vbH} />

        {/* Centre cartouche — authored as a RIGHT half in local coordinates:
            the origin sits on the moulding's outer edge and +y points INWARD,
            so the same shape drops onto any edge by translate/rotate. Its body
            runs from y=-14 (proud of the frame) to y≈46 (just past the 44-thick
            moulding), guaranteeing it laps the rail rather than floating. */}
        <g id={id("accent")}>
          <path
            d="M0 44 C32 42 58 32 76 16 C96 -2 118 -12 142 -14
               C126 2 116 20 112 34 C108 44 86 48 56 46 C36 45 16 45 0 45 Z"
            fill={url("orn")}
          />
          <path
            d="M142 -14 C162 -18 178 -8 178 8 C178 24 166 34 152 32"
            fill="none"
            stroke={url("orn")}
            strokeWidth="11"
            strokeLinecap="round"
          />
          <path
            d="M92 8 C112 2 132 8 142 24 C124 20 106 24 92 32 Z"
            fill={url("orn")}
          />
          <g fill="none" stroke={url("orn")} strokeWidth="6" strokeLinecap="round">
            <path d="M6 40 C24 30 40 16 50 0" />
            <path d="M8 44 C30 38 52 28 68 14" />
          </g>
        </g>

        {/* Corner cartouche (rect only) — the hero's wrapping acanthus, scaled
            down about the corner point to suit the thinner moulding. */}
        {shape === "rect" && (
          <g
            id={id("corner")}
            transform={`translate(${MARGIN},${MARGIN}) scale(0.8) translate(${-MARGIN},${-MARGIN})`}
          >
            <path
              d="M170 62 C130 50 92 58 72 80 C52 102 46 132 50 160
                 C52 178 58 192 66 202 C74 188 76 170 75 152
                 C74 128 82 108 98 96 C114 84 140 78 168 82 Z"
              fill={url("orn")}
            />
            <path
              d="M168 76 C188 70 202 78 204 92 C206 106 196 116 184 114"
              fill="none"
              stroke={url("orn")}
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M66 202 C72 220 88 226 99 216 C110 206 106 190 93 187"
              fill="none"
              stroke={url("orn")}
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M158 58 C168 38 190 26 212 30 C194 40 180 54 175 72 Z"
              fill={url("orn")}
            />
            <path
              d="M64 96 C44 106 30 128 29 152 C41 134 57 122 73 118 Z"
              fill={url("orn")}
            />
            <path
              d="M118 88 C134 98 143 116 140 134 C128 118 111 108 93 106 Z"
              fill={url("orn")}
            />
            <circle cx="76" cy="86" r="9" fill={url("orn")} />
          </g>
        )}
      </defs>

      <g filter={url("lift")}>
        {/* Moulding: rail → cove → flat inner lip. */}
        <g filter={url("carve")}>
          <path
            d={`${outlines[0]} ${outlines[1]}`}
            fillRule="evenodd"
            fill={url("rail")}
          />
          <path
            d={`${outlines[1]} ${outlines[2]}`}
            fillRule="evenodd"
            fill={url("cove")}
          />
          <path
            d={`${outlines[2]} ${outlines[3]}`}
            fillRule="evenodd"
            fill={url("lip")}
          />
        </g>

        {/* Ornaments, each lapping the rail so they read as one carving. */}
        <g filter={url("carve")}>
          {accentAt.map((t, i) => (
            <use key={i} href={`#${id("accent")}`} transform={t} />
          ))}
          {/* cabochons pinning the top and bottom accents to the rail */}
          <circle cx={cx} cy={MARGIN + 20} r="12" fill={url("orn")} />
          <circle cx={cx} cy={vbH - MARGIN - 20} r="12" fill={url("orn")} />

          {shape === "rect" && (
            <>
              <use href={`#${id("corner")}`} />
              <use
                href={`#${id("corner")}`}
                transform={`translate(${vbW},0) scale(-1,1)`}
              />
              <use
                href={`#${id("corner")}`}
                transform={`translate(0,${vbH}) scale(1,-1)`}
              />
              <use
                href={`#${id("corner")}`}
                transform={`translate(${vbW},${vbH}) scale(-1,-1)`}
              />
            </>
          )}
        </g>

        {/* Age: speckle across the gilt. */}
        <path
          d={`${outlines[0]} ${outlines[3]}`}
          fillRule="evenodd"
          filter={url("patina")}
          opacity="0.16"
        />
        <path
          d={`${outlines[1]} ${outlines[2]}`}
          fillRule="evenodd"
          fill={url("patinaTint")}
          opacity="0.5"
        />
      </g>
    </svg>
  );
}
