"use client";

import * as React from "react";
import * as THREE from "three";
import {
  Canvas,
  useFrame,
  useThree,
  invalidate,
  type ThreeEvent,
} from "@react-three/fiber";
import { Html, OrbitControls, Stars, useCursor } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

import type { NavItem } from "@/lib/types";
import { readCastleTheme, type CastleTheme } from "@/lib/tokens";
import { useEnterReveal } from "@/components/page-reveal";
import { HatSilhouette } from "@/components/sorting-hat/hat-icon";

type Vec3 = [number, number, number];

// Dev-only: free drag-to-orbit camera for inspecting the scene. Currently OFF so
// the normal cinematic camera + window transitions run. To re-enable inspection,
// set this back to: process.env.NODE_ENV !== "production".
const DEV_ORBIT = false;

/* ----------------------------------------------------------------------------
   Palette
   ---------------------------------------------------------------------------- */
const WHITE = "#8d7150"; // old-brown Hogwarts stone (name kept for reach)
const WHITE_DK = "#6f5839"; // shadowed brown stone
const PURPLE = "#4a3f8e";
const SLATE = "#34373d"; // dark-gray roof slate
const SLATE_DK = "#26282d"; // darker roof slate
const ROCK = "#474d60";
const ROCK_DK = "#313749";
const ROCK_LT = "#565d72";
const BRIDGE = WHITE; // brown viaduct stone, matching the towers
const WARM = "#ffcf6b";
const WATER = "#0b1734";

/* ----------------------------------------------------------------------------
   Anchoring heights — every structure sits flush on a plateau top.
   Left plateau is taller; right plateau is lower & flatter.
   ---------------------------------------------------------------------------- */
const WATER_Y = -3.2;
const LEFT_TOP = 0.7;
const RIGHT_TOP = 0.2;
/** How far each tower label floats ABOVE its window (world units). */
const LABEL_LIFT = 0.75;

/* Interactive nav towers (Projects/About/Resume). Index 0 (Great Hall) is a
   building, handled separately; Contact lives in the header nav. Each tower
   sits on its plateau top. */
const TOWERS: {
  href: string; // which nav route/item this physical tower represents
  position: Vec3;
  height: number;
  radius: number;
  windows?: number[]; // window heights as fractions of `height`; omit = default 4, [] = none
  extendIntoCone?: boolean; // push the body cylinder up into the cone so there's no gap at the eaves
}[] = [
  { href: "/sorting-hat", position: [-4.5, LEFT_TOP, -0.3], height: 5.8, radius: 1.5 }, // Ask the Sorting Hat — Main Astronomy Tower (tallest, thickest)
  { href: "/about", position: [5.6, RIGHT_TOP, 1], height: 3.4, radius: 0.8, extendIntoCone: true }, // Potions — Main Right Tower (forward, by the viaduct end)
  { href: "/projects", position: [2.4, RIGHT_TOP, 0.7], height: 4.7, radius: 0.62, extendIntoCone: true }, // Library — Castellated Bridge Tower
];

// Route → its structure. `win` = offset (from the plateau-base center `c`) of an
// actual LIT window; `cam` = where the camera ends relative to that window. All
// windows here sit on the front (+z) face, so the camera flies straight in.
// Used to fly INTO the window (forward) and to start the "back to castle" intro.
const STRUCTURE_BY_ROUTE: Record<string, { c: Vec3; win: Vec3; cam: Vec3 }> = {
  // Great Hall — the window on the front tower (DecoTower at z = depth/2 + 0.1).
  // `cam` is slightly NEGATIVE: the camera flies just PAST the middle of the
  // window (a hair inside, where the yellow interior fills the view) — not all the
  // way into the tower.
  "/great-hall": { c: [-7, LEFT_TOP, -2], win: [0.2, 1.4, 3.37], cam: [0, 0.1, 0.16] },
  // Towers — a mid window on the front face (y = height*0.5, z = radius*0.92).
  // Ask the Sorting Hat = the big tower at [-4.5]; Library = the tower at [2.4].
  "/sorting-hat": { c: [-4.5, LEFT_TOP, -0.3], win: [0, 4.8, 0.5], cam: [0, 0, 1.08] },
  // Potions — enter the TOP window (height 3.4 × 0.82 ≈ 2.79). win[1] picks the
  // window row; use 3.4 × {0.34,0.5,0.66,0.82} = {1.16,1.7,2.24,2.79} for the others.
  "/about": { c: [5.6, RIGHT_TOP, 1.4], win: [0, 2.79, 0.7], cam: [0, 0, 0.14] },
  "/projects": { c: [2.4, RIGHT_TOP, 0.7], win: [0, 3.9, 0.57], cam: [0, 0, 0.14] },
  // Owlery — a tall slim tower behind/left of About; single window high under the roof.
  "/contact": { c: [5.0, RIGHT_TOP, -0.5], win: [0, 5.87, 0.47], cam: [0, 0, 0.14] },
};

/** Camera pose that flies INTO a structure's lit window (close up). */
function enterPose(href: string, center: THREE.Vector3) {
  const s = STRUCTURE_BY_ROUTE[href];
  const w = s ? s.win : [0, 2, 1];
  const cam = s ? s.cam : [0, 0, 1.2];
  const win = new THREE.Vector3(center.x + w[0], center.y + w[1], center.z + w[2]);
  return {
    // Aim straight THROUGH the window, deeper into the tower (windows face +z, so
    // -z is inward), so the POV faces the yellow interior as it flies in.
    look: new THREE.Vector3(win.x, win.y, win.z - 1),
    pos: new THREE.Vector3(win.x + cam[0], win.y + cam[1], win.z + cam[2]),
  };
}

// Camera: low, three-quarter front-LEFT (left close & prominent, right recedes).
const WIDE_POS = new THREE.Vector3(-12, 0.5, 15);
const WIDE_LOOK = new THREE.Vector3(0, 6, -3);

// On narrow (portrait / mobile) screens the horizontal field of view shrinks, so
// the wide "whole castle" shot gets cropped at the sides. Pull the camera back as
// the screen narrows so the full castle stays framed. 1 = the tuned desktop shot.
const DOLLY_REF_ASPECT = 1.7; // at/above this aspect, keep the desktop framing
const DOLLY_MAX = 1.7; // furthest pull-back on very narrow phones
function viewportDolly(width: number, height: number): number {
  const aspect = width / Math.max(1, height);
  if (aspect >= DOLLY_REF_ASPECT) return 1;
  return Math.min(DOLLY_REF_ASPECT / aspect, DOLLY_MAX);
}
/** A camera pose framing a structure head-on from the front (+z), full height.
 *  cx/cy/cz = its base center, h = its height, dist = how far in front to stand. */
function frontPose(cx: number, cy: number, cz: number, h: number, dist: number) {
  return {
    pos: new THREE.Vector3(cx, cy + h * 0.55, cz + dist),
    look: new THREE.Vector3(cx, cy + h * 0.5, cz),
  };
}

// Scroll TOUR — scrolling steps the camera through these poses in order. For each
// tower there's a close "zoom IN" pose then a slightly pulled-back "out a little"
// pose, then it moves on; it ends back at the original wide POV. Per tower, the
// smaller `dist` = the zoom-in, the larger `dist` = the pull-back (tweak these).
const TOUR: { pos: THREE.Vector3; look: THREE.Vector3 }[] = [
  { pos: WIDE_POS.clone(), look: WIDE_LOOK.clone() }, // original POV (start)
  frontPose(-6.8, LEFT_TOP, 1, 3, 4.0), // Great Hall — zoom in
  frontPose(-4, LEFT_TOP, 11, 8, 5.2), // Great Hall — out a little
  frontPose(-4.5, LEFT_TOP, 1, 10, 4.2), // Projects — zoom in
  frontPose(0, LEFT_TOP, 11, 7, 5.2), // Projects — out a little
  frontPose(2.4, RIGHT_TOP, 0.5, 8, 4.2), // Resume — zoom in
  frontPose(2.4, RIGHT_TOP, 11, 9, 5.2), // Resume — out a little
  frontPose(5.0, RIGHT_TOP, 0.5, 11.5, 3.2), // Contact — zoom in
  frontPose(5.0, RIGHT_TOP, 8, 6.9, 8.0), // Contact — out a little
  frontPose(5.6, RIGHT_TOP, 2, 5.6, 2.8), // About — zoom in
  { pos: WIDE_POS.clone(), look: WIDE_LOOK.clone() }, // back to original POV
];

// Which TOUR stop frames each route head-on (its "zoom-in" pose). Returning from
// a content page rests the camera here instead of the wide overview, and the
// scroll tour resumes from this stop. Keep the indices in sync with TOUR above.
const TOUR_STOP_BY_ROUTE: Record<string, number> = {
  "/great-hall": 1,
  "/sorting-hat": 3, // big tower at [-4.5]
  "/projects": 5, // Library tower at [2.4]
  "/contact": 7,
  "/about": 9,
};

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

// Soft window "breathing" while the camera rests at a structure's front pose.
const PULSE_W = 3.4; // angular speed (rad/s) → ~1.85s period
const PULSE_MIN = 1.4; // dimmest emissive at the trough
const PULSE_MAX = 4.0; // brightest emissive at the peak
const FRONT_POSE_RANGE = 0.06; // how near descend must sit to the stop to pulse
/** 1 when the scroll tour rests exactly on this route's front pose, 0 when far. */
function frontPoseNearness(href: string, d: number): number {
  const stop = TOUR_STOP_BY_ROUTE[href];
  if (stop == null) return 0;
  const frac = stop / (TOUR.length - 1);
  let dist = Math.abs(d - frac);
  dist = Math.min(dist, 1 - dist); // the tour loops → circular distance
  return Math.max(0, 1 - dist / FRONT_POSE_RANGE);
}
/** Target window emissive: a soft breathing pulse at the front pose, else `base`. */
function frontPosePulse(near: number, base: number): number {
  if (near <= 0) return base;
  const phase = 0.5 + 0.5 * Math.sin((performance.now() / 1000) * PULSE_W);
  return Math.max(base, PULSE_MIN + near * (PULSE_MAX - PULSE_MIN) * phase);
}

/* ----------------------------------------------------------------------------
   Viaduct arch-wall shape (real openings via ExtrudeGeometry holes).
   ---------------------------------------------------------------------------- */
function makeArchWall(spanCount: number, archW: number, pierW: number, wallH: number) {
  const totalW = spanCount * archW + (spanCount + 1) * pierW;
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(totalW, 0);
  shape.lineTo(totalW, wallH);
  shape.lineTo(0, wallH);
  shape.lineTo(0, 0);
  for (let i = 0; i < spanCount; i++) {
    const x0 = pierW + i * (archW + pierW);
    const r = archW / 2;
    const springY = Math.max(wallH - r - 0.3, r + 0.1);
    const h = new THREE.Path();
    h.moveTo(x0, 0);
    h.lineTo(x0, springY);
    h.absarc(x0 + r, springY, r, Math.PI, 0, true);
    h.lineTo(x0 + archW, 0);
    h.lineTo(x0, 0);
    shape.holes.push(h);
  }
  return { shape, totalW };
}

const BRIDGE_DEPTH = 0.4;
const BRIDGE_BOTTOM = -3.4;
// Bridge height = LOWER_TIER_H + UPPER_TIER_H. These drive the arch geometry AND
// the stacking of the upper tier / deck / deck-towers, so the bridge stays solid.
const LOWER_TIER_H = 2.5; // tall lower arch tier
const UPPER_TIER_H = 0.9; // short upper arch tier
const LOWER_TIER = makeArchWall(14, 0.45, 0.42, LOWER_TIER_H);
const UPPER_TIER = makeArchWall(20, 0.3, 0.22, UPPER_TIER_H);
const EXTRUDE = { depth: BRIDGE_DEPTH, bevelEnabled: false } as const;

/* ----------------------------------------------------------------------------
   Procedural textures (canvas) — brick for the castle, tiled slate for roofs,
   mottled rock for the cliffs. Built lazily on the client; shared via cache.
   ---------------------------------------------------------------------------- */
let _brick: THREE.Texture | null = null;
let _roof: THREE.Texture | null = null;
let _rock: THREE.Texture | null = null;

function brickTexture(): THREE.Texture | undefined {
  if (typeof document === "undefined") return undefined;
  if (_brick) return _brick;
  const s = 128;
  const cv = document.createElement("canvas");
  cv.width = cv.height = s;
  const ctx = cv.getContext("2d");
  if (!ctx) return undefined;
  ctx.fillStyle = "#c4c4c4"; // mortar (neutral; tinted by material color)
  ctx.fillRect(0, 0, s, s);
  ctx.fillStyle = "#f2f2f2"; // brick (neutral; tinted by material color)
  const bh = s / 8;
  const bw = s / 4;
  for (let row = 0; row < 8; row++) {
    const off = row % 2 ? -bw / 2 : 0;
    for (let col = -1; col < 5; col++) {
      ctx.fillRect(col * bw + off + 1.5, row * bh + 1.5, bw - 3, bh - 3);
    }
  }
  _brick = new THREE.CanvasTexture(cv);
  _brick.wrapS = _brick.wrapT = THREE.RepeatWrapping;
  _brick.repeat.set(2, 3);
  return _brick;
}

function roofTexture(): THREE.Texture | undefined {
  if (typeof document === "undefined") return undefined;
  if (_roof) return _roof;
  const s = 128;
  const cv = document.createElement("canvas");
  cv.width = cv.height = s;
  const ctx = cv.getContext("2d");
  if (!ctx) return undefined;
  ctx.fillStyle = "#cacaca";
  ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = "rgba(20,20,20,0.5)";
  ctx.lineWidth = 2;
  for (let y = 0; y <= s; y += s / 8) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(s, y);
    ctx.stroke();
  }
  _roof = new THREE.CanvasTexture(cv);
  _roof.wrapS = _roof.wrapT = THREE.RepeatWrapping;
  _roof.repeat.set(3, 4);
  return _roof;
}

function rockTexture(): THREE.Texture | undefined {
  if (typeof document === "undefined") return undefined;
  if (_rock) return _rock;
  const s = 128;
  const cv = document.createElement("canvas");
  cv.width = cv.height = s;
  const ctx = cv.getContext("2d");
  if (!ctx) return undefined;
  ctx.fillStyle = "#474d60";
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 1600; i++) {
    const v = 45 + Math.floor(Math.random() * 55);
    ctx.fillStyle = `rgba(${v},${v + 6},${v + 22},0.5)`;
    ctx.fillRect(Math.random() * s, Math.random() * s, 2, 2);
  }
  _rock = new THREE.CanvasTexture(cv);
  _rock.wrapS = _rock.wrapT = THREE.RepeatWrapping;
  _rock.repeat.set(2, 2);
  return _rock;
}

let _cloud: THREE.Texture | null = null;
/** Soft blurry cloud puff — overlapping feathered radial blobs on transparency. */
function cloudTexture(): THREE.Texture | undefined {
  if (typeof document === "undefined") return undefined;
  if (_cloud) return _cloud;
  const s = 256;
  const cv = document.createElement("canvas");
  cv.width = cv.height = s;
  const ctx = cv.getContext("2d");
  if (!ctx) return undefined;
  for (let i = 0; i < 30; i++) {
    const x = s * (0.18 + Math.random() * 0.64);
    const y = s * (0.3 + Math.random() * 0.4);
    const r = s * (0.07 + Math.random() * 0.15);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(255,255,255,0.14)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  _cloud = new THREE.CanvasTexture(cv);
  return _cloud;
}

/* ============================================================================
   Reusable detail pieces
   ============================================================================ */

function Glow({
  position,
  size = [0.16, 0.42, 0.06],
  color = WARM,
  intensity = 1.4,
  rotation,
  register,
}: {
  position: Vec3;
  size?: Vec3;
  color?: string;
  intensity?: number;
  rotation?: Vec3;
  /** Collect the material so a parent can animate its glow (e.g. on hover). */
  register?: (m: THREE.MeshStandardMaterial | null) => void;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        ref={register}
        color={color}
        emissive={color}
        emissiveIntensity={intensity}
        toneMapped={false}
      />
    </mesh>
  );
}

function Crenellations({
  radius,
  y,
  count = 12,
  color = WHITE_DK,
  size = [0.16, 0.28, 0.16],
}: {
  radius: number;
  y: number;
  count?: number;
  color?: string;
  size?: Vec3;
}) {
  const merlons = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    merlons.push(
      <mesh
        key={i}
        position={[Math.cos(a) * radius, y, Math.sin(a) * radius]}
        rotation={[0, -a, 0]}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>,
    );
  }
  return <group>{merlons}</group>;
}

function DecoTower({
  position,
  radius,
  height,
  body = WHITE,
  roof = SLATE,
  crenel = false,
  windows = 0,
  band = false,
  registerWindow,
  rotation = [0, 0, 0] as Vec3,
}: {
  position: Vec3;
  radius: number;
  height: number;
  body?: string;
  roof?: string;
  crenel?: boolean;
  windows?: number;
  band?: boolean;
  registerWindow?: (m: THREE.MeshStandardMaterial | null) => void;
  rotation?: Vec3; // tilt from the base; e.g. [0,0,0.2] leans it sideways
}) {
  const coneH = radius * 2.6;
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[radius * 0.9, radius, height, 14]} />
        <meshStandardMaterial color={body} roughness={0.85} map={brickTexture()} />
      </mesh>
      {/* glowing yellow interior, set well inside the wall (a wide gap) so it
          never bleeds through the brick from outside; fills the view once inside */}
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[radius * 0.7, radius * 0.82, height * 0.98, 20]} />
        <meshStandardMaterial
          color={WARM}
          emissive={WARM}
          emissiveIntensity={1.2}
          side={THREE.BackSide}
          toneMapped={false}
        />
      </mesh>
      {band && (
        <mesh position={[0, height - 0.25, 0]}>
          <cylinderGeometry args={[radius * 0.96, radius * 0.96, 0.2, 14]} />
          <meshStandardMaterial color={roof} roughness={0.8} map={roofTexture()} />
        </mesh>
      )}
      {crenel && (
        <Crenellations
          radius={radius * 1.0}
          y={height + 0.02}
          count={Math.max(8, Math.round(radius * 16))}
        />
      )}
      <mesh position={[0, height + coneH / 2, 0]}>
        <coneGeometry args={[radius * 1.15, coneH, 16]} />
        <meshStandardMaterial
          color={roof}
          roughness={0.7}
          metalness={0.1}
          map={roofTexture()}
        />
      </mesh>
      {Array.from({ length: windows }).map((_, i) => (
        <Glow
          key={i}
          position={[0, height * 0.32 + i * 0.5, radius * 0.92]}
          register={registerWindow}
        />
      ))}
    </group>
  );
}

function Spire({
  position,
  radius = 0.32,
  height = 3,
  body = WHITE,
  roof = SLATE,
}: {
  position: Vec3;
  radius?: number;
  height?: number;
  body?: string;
  roof?: string;
}) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[radius * 0.85, radius, height, 10]} />
        <meshStandardMaterial color={body} roughness={0.85} map={brickTexture()} />
      </mesh>
      <mesh position={[0, height + radius * 1.6, 0]}>
        <coneGeometry args={[radius * 1.2, radius * 7.2, 12]} />
        <meshStandardMaterial color={roof} roughness={0.7} map={roofTexture()} />
      </mesh>
    </group>
  );
}

function GableHall({
  position,
  rotation = [0, 0, 0],
  width = 2.6,
  depth = 5,
  height = 2.2,
  body = WHITE,
  roof = SLATE,
  windows = 6,
  ridgeSpireCount = 4,
  steep = 0.5,
  coverFront = false,
  coverBack = false,
  bothSides = false,
  registerWindow,
}: {
  position: Vec3;
  rotation?: Vec3;
  width?: number;
  depth?: number;
  height?: number;
  body?: string;
  roof?: string;
  windows?: number;
  ridgeSpireCount?: number;
  steep?: number;
  coverFront?: boolean;
  coverBack?: boolean;
  bothSides?: boolean;
  registerWindow?: (m: THREE.MeshStandardMaterial | null) => void;
}) {
  const rh = width * steep;
  const hw = width / 2;
  const slope = Math.sqrt(hw * hw + rh * rh);
  const ang = Math.atan2(rh, hw);
  const gable = React.useMemo(() => {
    const sp = new THREE.Shape();
    sp.moveTo(-hw, 0);
    sp.lineTo(hw, 0);
    sp.lineTo(0, rh);
    sp.closePath();
    return sp;
  }, [hw, rh]);
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={body} roughness={0.85} map={brickTexture()} />
      </mesh>
      <mesh position={[-hw / 2, height + rh / 2, 0]} rotation={[0, 0, ang]}>
        <boxGeometry args={[slope, 0.14, depth + 0.12]} />
        <meshStandardMaterial color={roof} roughness={0.7} map={roofTexture()} />
      </mesh>
      <mesh position={[hw / 2, height + rh / 2, 0]} rotation={[0, 0, -ang]}>
        <boxGeometry args={[slope, 0.14, depth + 0.12]} />
        <meshStandardMaterial color={roof} roughness={0.7} map={roofTexture()} />
      </mesh>
      {/* solid triangular wall closing the front gable */}
      {coverFront && (
        <mesh position={[0, height, depth / 2 + 0.07]}>
          <shapeGeometry args={[gable]} />
          <meshStandardMaterial
            color={body}
            roughness={0.85}
            side={THREE.DoubleSide}
            map={brickTexture()}
          />
        </mesh>
      )}
      {/* solid triangular wall closing the back gable */}
      {coverBack && (
        <mesh position={[0, height, -depth / 2 - 0.07]}>
          <shapeGeometry args={[gable]} />
          <meshStandardMaterial
            color={body}
            roughness={0.85}
            side={THREE.DoubleSide}
            map={brickTexture()}
          />
        </mesh>
      )}
      {/* horizontal window row along the side(s) */}
      {Array.from({ length: windows }).map((_, i) => {
        const z = -depth / 2 + (depth / (windows + 1)) * (i + 1);
        return (
          <React.Fragment key={i}>
            <Glow
              position={[width / 2 - 0.025, height * 0.5, z]}
              size={[0.06, 0.5, 0.18]}
              register={registerWindow}
            />
            {bothSides && (
              <Glow
                position={[-width / 2 + 0.025, height * 0.5, z]}
                size={[0.06, 0.5, 0.18]}
                register={registerWindow}
              />
            )}
          </React.Fragment>
        );
      })}
      {Array.from({ length: ridgeSpireCount }).map((_, i, arr) => {
        const z = -depth / 2 + (depth / (arr.length + 1)) * (i + 1);
        return (
          <mesh key={`s${i}`} position={[0, height + rh + 0.22, z]}>
            <coneGeometry args={[0.1, 0.6, 6]} />
            <meshStandardMaterial color={WHITE_DK} roughness={0.8} />
          </mesh>
        );
      })}
    </group>
  );
}

function Rock({
  position,
  scale,
  color = ROCK,
  detail = 1,
}: {
  position: Vec3;
  scale: Vec3;
  color?: string;
  detail?: number; // icosahedron subdivisions; higher = rounder / less pointy
}) {
  return (
    <mesh position={position} scale={scale}>
      <icosahedronGeometry args={[1, detail]} />
      <meshStandardMaterial color={color} flatShading roughness={1} map={rockTexture()} />
    </mesh>
  );
}

/** Flat-topped rocky plateau: structures sit flush on `top`; jagged sides fall
 *  to the water. Faceted (low-poly) for the crisp papercraft-rock look. */
function Plateau({
  cx,
  cz,
  top,
  rTop,
  rBot,
  color = ROCK,
}: {
  cx: number;
  cz: number;
  top: number;
  rTop: number;
  rBot: number;
  color?: string;
}) {
  const h = top - WATER_Y + 1; // extend below the water line
  return (
    <mesh position={[cx, top - h / 2, cz]}>
      <cylinderGeometry args={[rTop, rBot, h, 8]} />
      <meshStandardMaterial color={color} flatShading roughness={1} map={rockTexture()} />
    </mesh>
  );
}

/** Left landmass — taller, jagged; flat top at LEFT_TOP. */
function LeftCliff() {
  return (
    <group>
      {/* widened so the rock reaches under the courtyard, out toward the viaduct */}
      <Plateau cx={-6.2} cz={2.5} top={LEFT_TOP} rTop={2} rBot={5.2} color={ROCK} />
      {/* broad rock under the Great Hall so its (slanted) floor never floats —
          centered on the moved hall, wide enough to reach the slanted back end */}
      <Plateau cx={-7.4} cz={-2.0} top={LEFT_TOP} rTop={3.9} rBot={6} color={ROCK} />
      {/* craggy accents on the flanks */}
      <Rock position={[-7.6, -1.4, -0.2]} scale={[1.7, 2.8, 1.7]} color={ROCK_DK} />
      <Rock position={[-4.2, -1.5, -0.4]} scale={[3, 2.6, 3]} color={ROCK_LT} />
      {/* tall jagged peaks rising behind the buildings */}
      <Rock position={[-6.6, 0.6, -2.8]} scale={[1.5, 2.8, 1.4]} color={ROCK_DK} />
      <Rock position={[-4.4, 0.3, -3.2]} scale={[1.3, 2.4, 1.3]} color={ROCK} />
      {/* long descending ridge to the SW (camera POV) — rounded boulders,
          stepping down to the water */}
      <Rock position={[-5, -5.07, 4]} scale={[3.0, 6, 3]} color={ROCK} detail={2} />
      <Rock position={[-6.3, -2.3, 4]} scale={[2.3, 3.1, 3.4]} color={ROCK_DK} detail={2} />
      <Rock position={[-7.5, -3, 5.7]} scale={[1.9, 2.8, 2.0]} color={ROCK} detail={2} />
      <Rock position={[-7.5, -3.8, 7]} scale={[1.6, 2.6, 1.8]} color={ROCK_DK} detail={2} />
    </group>
  );
}

/** Right landmass — lower, broad, flatter; flat top at RIGHT_TOP. */
function RightCliff() {
  return (
    <group>
      <Plateau cx={5.6} cz={-0.4} top={RIGHT_TOP} rTop={4.0} rBot={6} color={ROCK} />
      <Rock position={[8.8, -3.4, -0.2]} scale={[3.5, 4, 2]} color={ROCK_DK} />
      <Rock position={[2.6, -1.7, 0.6]} scale={[1.3, 2.2, 1.3]} color={ROCK_LT} />
      <Rock position={[6.4, -0.7, -2.6]} scale={[1.5, 1.9, 1.4]} color={ROCK_DK} />
    </group>
  );
}

/** A wide rectangular wing on the bridge deck (windowed) with a pitched gable
 *  roof whose ridge runs left↔right — so the triangular gable ends face ±X and
 *  the front camera sees the sloped side. */
function DeckWing({
  x,
  deckTop,
  width,
  height,
  depth = 1.3,
  z = 0,
  rotation = [0, 0, 0] as Vec3,
}: {
  x: number;
  deckTop: number;
  width: number;
  height: number;
  depth?: number;
  z?: number;
  rotation?: Vec3; // tilt from the base; z-rotation leans it left/right
}) {
  const winCount = Math.max(2, Math.round(width / 0.95));
  const rise = depth * 0.6;
  const hd = depth / 2;
  const slope = Math.sqrt(hd * hd + rise * rise);
  const ang = Math.atan2(rise, hd);
  // Triangle closing the gable ends (in the z-y plane): base spans the depth,
  // peak rises to the ridge. Faces ±X once rotated 90° about Y.
  const gableEnd = React.useMemo(() => {
    const sp = new THREE.Shape();
    sp.moveTo(-hd, 0);
    sp.lineTo(hd, 0);
    sp.lineTo(0, rise);
    sp.closePath();
    return sp;
  }, [hd, rise]);
  return (
    <group position={[x, deckTop, z]} rotation={rotation}>
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={WHITE} roughness={0.85} map={brickTexture()} />
      </mesh>
      {/* gable roof — two slopes meeting at a ridge along X */}
      <mesh position={[0, height + rise / 2, -hd / 2]} rotation={[-ang, 0, 0]}>
        <boxGeometry args={[width + 0.12, 0.14, slope + 0.06]} />
        <meshStandardMaterial color={SLATE} roughness={0.7} map={roofTexture()} />
      </mesh>
      <mesh position={[0, height + rise / 2, hd / 2]} rotation={[ang, 0, 0]}>
        <boxGeometry args={[width + 0.12, 0.14, slope + 0.06]} />
        <meshStandardMaterial color={SLATE} roughness={0.7} map={roofTexture()} />
      </mesh>
      {/* solid triangular walls closing both gable ends (±X) */}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[(s * width) / 2, height, 0]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <shapeGeometry args={[gableEnd]} />
          <meshStandardMaterial
            color={WHITE}
            roughness={0.85}
            side={THREE.DoubleSide}
            map={brickTexture()}
          />
        </mesh>
      ))}
      {/* glowing window row on the front face */}
      {Array.from({ length: winCount }).map((_, i) => {
        const wx = -width / 2 + (width / (winCount + 1)) * (i + 1);
        return (
          <Glow
            key={i}
            position={[wx, height * 0.5, depth / 2 + 0.03]}
            size={[0.16, 0.42, 0.06]}
          />
        );
      })}
    </group>
  );
}

/** Double-decker arched viaduct (five arches) connecting the two plateaus. */
function Viaduct({ position = [0, 0, 0] as Vec3 }: { position?: Vec3 }) {
  return (
    <group position={position}>
      <mesh position={[-LOWER_TIER.totalW / 2, BRIDGE_BOTTOM, -BRIDGE_DEPTH / 2]}>
        <extrudeGeometry args={[LOWER_TIER.shape, EXTRUDE]} />
        <meshStandardMaterial color={BRIDGE} roughness={0.9} flatShading />
      </mesh>
      <mesh position={[-UPPER_TIER.totalW / 2, BRIDGE_BOTTOM + LOWER_TIER_H, -BRIDGE_DEPTH / 2]}>
        <extrudeGeometry args={[UPPER_TIER.shape, EXTRUDE]} />
        <meshStandardMaterial color={BRIDGE} roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, BRIDGE_BOTTOM + LOWER_TIER_H + UPPER_TIER_H + 0.09, 0]}>
        <boxGeometry args={[LOWER_TIER.totalW + 0.4, 0.18, BRIDGE_DEPTH + 0.25]} />
        <meshStandardMaterial color={BRIDGE} roughness={0.85} map={roofTexture()} />
      </mesh>

      {/* Dark recessed wall just behind the arches so the openings read as deep,
          shadowed holes instead of see-through gaps. */}
      <mesh position={[0, BRIDGE_BOTTOM + (LOWER_TIER_H + UPPER_TIER_H) / 2, -BRIDGE_DEPTH / 2 - 0.06]}>
        <boxGeometry args={[LOWER_TIER.totalW, LOWER_TIER_H + UPPER_TIER_H, 0.08]} />
        <meshStandardMaterial color="#0a0c14" roughness={1} />
      </mesh>

    </group>
  );
}

function Water() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, WATER_Y, 6]}>
      <planeGeometry args={[120, 90]} />
      <meshStandardMaterial color={WATER} roughness={0.25} metalness={0.6} />
    </mesh>
  );
}

/* ============================================================================
   Night atmosphere — distant mountains, drifting fog-clouds, and fireflies.
   All tagged { noShadow: true } so the shadow pass ignores them.
   ============================================================================ */

/** Distant mountain range behind the castle. Basic (unlit) materials = pure
 *  silhouettes; the scene's exponential fog fades them into the darkness, the
 *  far ridge more than the near one. */
const MOUNTAINS: { x: number; z: number; h: number; r: number; far: boolean }[] = [
  // far ridge
  { x: -38, z: -36, h: 12, r: 14, far: true },
  { x: -24, z: -37, h: 15, r: 16, far: true },
  { x: -8, z: -38, h: 11, r: 13, far: true },
  { x: 6, z: -36, h: 16, r: 17, far: true },
  { x: 22, z: -37, h: 12, r: 14, far: true },
  { x: 38, z: -36, h: 14, r: 15, far: true },
  // nearer, slightly lighter ridge
  { x: -44, z: -26, h: 10, r: 11, far: false },
  { x: -30, z: -26, h: 9, r: 10, far: false },
  { x: -14, z: -27, h: 12, r: 12, far: false },
  { x: 2, z: -26, h: 8, r: 9, far: false },
  { x: 14, z: -27, h: 11, r: 11, far: false },
  { x: 30, z: -25, h: 9, r: 10, far: false },
  { x: 44, z: -27, h: 12, r: 12, far: false },
];

function Mountains() {
  return (
    <group>
      {MOUNTAINS.map((m, i) => (
        <mesh
          key={i}
          position={[m.x, WATER_Y - 0.5 + m.h / 2, m.z]}
          rotation={[0, (i * 0.7) % Math.PI, 0]}
          userData={{ noShadow: true }}
        >
          <coneGeometry args={[m.r, m.h, 6]} />
          <meshBasicMaterial color={m.far ? "#151a2c" : "#1e2440"} />
        </mesh>
      ))}
    </group>
  );
}

/** Very faint cloud/fog sheets covering the sky behind the castle, drifting
 *  slowly. Sinusoidal drift (not wrap-around) so there's never a pop. */
const CLOUD_SHEETS: {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  opacity: number;
  drift: number;
}[] = [
  { x: -18, y: 6, z: -22, w: 46, h: 13, opacity: 0.11, drift: 0.05 },
  { x: 10, y: 9, z: -28, w: 60, h: 17, opacity: 0.08, drift: 0.035 },
  { x: 26, y: 4.5, z: -20, w: 38, h: 11, opacity: 0.13, drift: 0.06 },
  { x: -2, y: 12, z: -32, w: 72, h: 20, opacity: 0.06, drift: 0.025 },
  { x: -34, y: 8, z: -30, w: 50, h: 15, opacity: 0.07, drift: 0.045 },
];

function NightClouds() {
  const group = React.useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    g.children.forEach((c, i) => {
      const def = CLOUD_SHEETS[i];
      if (!def) return;
      c.position.x = def.x + Math.sin(t * def.drift + i * 2.1) * 9;
    });
  });
  return (
    <group ref={group}>
      {CLOUD_SHEETS.map((c, i) => (
        <mesh key={i} position={[c.x, c.y, c.z]} userData={{ noShadow: true }}>
          <planeGeometry args={[c.w, c.h]} />
          <meshBasicMaterial
            map={cloudTexture()}
            color="#8fa2d6"
            transparent
            opacity={c.opacity}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Tiny bright fireflies drifting around the whole scene. Additive warm points
 *  that catch the bloom pass. This component also keeps the demand frameloop
 *  ticking (each rendered frame requests the next) so the drift is continuous —
 *  except for reduced-motion users, where the flies simply rest. */
const FIREFLY_COUNT = 140;

function Fireflies() {
  const pts = React.useRef<THREE.Points>(null);
  const inv = useThree((s) => s.invalidate);
  const reduced = React.useMemo(
    () =>
      typeof window !== "undefined" &&
      !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  // Rest position + independent per-axis phase/speed → gentle wandering.
  const { geom, base, phase, speed } = React.useMemo(() => {
    const base = new Float32Array(FIREFLY_COUNT * 3);
    const phase = new Float32Array(FIREFLY_COUNT * 3);
    const speed = new Float32Array(FIREFLY_COUNT * 3);
    for (let i = 0; i < FIREFLY_COUNT * 3; i += 3) {
      base[i] = (Math.random() * 2 - 1) * 16; // x — across the whole scene
      base[i + 1] = WATER_Y + 0.4 + Math.random() * 10.5; // y — water to above the towers
      base[i + 2] = -8 + Math.random() * 17; // z — behind the castle to near the camera
      for (let a = 0; a < 3; a++) {
        phase[i + a] = Math.random() * Math.PI * 2;
        speed[i + a] = 0.15 + Math.random() * 0.45;
      }
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(base.slice(), 3));
    return { geom, base, phase, speed };
  }, []);
  React.useEffect(() => () => geom.dispose(), [geom]);

  useFrame((state) => {
    const p = pts.current;
    if (!p) return;
    const t = state.clock.elapsedTime;
    const attr = p.geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < FIREFLY_COUNT * 3; i += 3) {
      arr[i] = base[i] + Math.sin(t * speed[i] + phase[i]) * 1.7;
      arr[i + 1] = base[i + 1] + Math.sin(t * speed[i + 1] + phase[i + 1]) * 0.9;
      arr[i + 2] = base[i + 2] + Math.cos(t * speed[i + 2] + phase[i + 2]) * 1.3;
    }
    attr.needsUpdate = true;
    if (!reduced) inv();
  });

  return (
    <points ref={pts} geometry={geom} frustumCulled={false} userData={{ noShadow: true }}>
      <pointsMaterial
        size={0.04}
        sizeAttenuation
        color="#ffe9a0"
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

/* ============================================================================
   Scene root
   ============================================================================ */

export function CastleScene({
  items,
  descendRef,
  onReady,
}: {
  items: NavItem[];
  descendRef?: React.MutableRefObject<number>;
  onReady?: (invalidate: () => void) => void;
}) {
  const enter = useEnterReveal();
  const [theme] = React.useState<CastleTheme>(() => readCastleTheme());
  const fallbackDescend = React.useRef(0);
  const dRef = descendRef ?? fallbackDescend;

  return (
    <Canvas
      frameloop="demand"
      shadows
      dpr={[1, 2]}
      camera={{ position: [-11, 2.6, 15.5], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
      className="!absolute inset-0"
    >
      <SceneContents
        items={items}
        theme={theme}
        descendRef={dRef}
        onReady={onReady}
        onNavigate={(href) => enter(href)}
      />
    </Canvas>
  );
}

type FlyTarget = {
  fromPos: THREE.Vector3;
  fromLook: THREE.Vector3;
  toPos: THREE.Vector3;
  toLook: THREE.Vector3;
  durationMs: number;
  startWall: number;
  captured: boolean;
  /** Hold the camera at `fromPos` for this long before moving (the "pause"). */
  holdMs?: number;
  /** Intro = zoom OUT from a tower to the wide view (no navigation). */
  intro?: boolean;
} | null;

function SceneContents({
  items,
  theme,
  descendRef,
  onNavigate,
  onReady,
}: {
  items: NavItem[];
  theme: CastleTheme;
  descendRef: React.MutableRefObject<number>;
  onNavigate: (href: string) => void;
  onReady?: (invalidate: () => void) => void;
}) {
  const flyRef = React.useRef<FlyTarget>(null);
  const navigatedRef = React.useRef(false);
  const inv = useThree((s) => s.invalidate);
  const scene = useThree((s) => s.scene);
  const size = useThree((s) => s.size);
  const driveRef = React.useRef<number | null>(null);
  // Lighten fog in step with the mobile camera pull-back so the farther (whole-
  // castle) shot doesn't fade into the haze.
  const fogDensity = 0.015 / viewportDolly(size.width, size.height);

  React.useEffect(() => {
    onReady?.(inv);
  }, [inv, onReady]);

  // Advance an effect over `durationMs` on wall-clock, calling invalidate() each
  // tick so frames keep flowing even while the canvas is being SVG-filtered
  // (which can otherwise stall the R3F demand loop). Independent of useFrame, so
  // the navigation at the end always fires.
  const drive = React.useCallback(
    (durationMs: number, onTick?: (p: number) => void, onEnd?: () => void) => {
      if (driveRef.current != null) cancelAnimationFrame(driveRef.current);
      let start: number | null = null;
      const step = (ts: number) => {
        if (start === null) start = ts;
        const p = Math.min((ts - start) / durationMs, 1);
        onTick?.(p);
        invalidate();
        if (p < 1) {
          driveRef.current = requestAnimationFrame(step);
        } else {
          driveRef.current = null;
          onEnd?.();
        }
      };
      driveRef.current = requestAnimationFrame(step);
    },
    [],
  );

  React.useEffect(
    () => () => {
      if (driveRef.current != null) cancelAnimationFrame(driveRef.current);
    },
    [],
  );

  // Realism: let every mesh cast + receive shadows (one pass, after mount).
  // Atmosphere pieces (mountains/clouds/fireflies) opt out via userData.noShadow.
  React.useEffect(() => {
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && !m.userData.noShadow) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    inv();
  }, [scene, inv]);

  // Window reached → navigate. The destination then opens through a growing
  // circular reveal over the castle (see page-reveal.tsx).
  const handleArrive = React.useCallback(
    (href: string) => {
      onNavigate(href);
    },
    [onNavigate],
  );

  // Every tower (incl. the Great Hall) does the same thing: slowly fly INTO the
  // window, then navigate — the page reveal grows the destination out of it.
  const handleSelect = React.useCallback(
    (item: NavItem, pos: THREE.Vector3) => {
      if (navigatedRef.current) return;
      navigatedRef.current = true;
      const enter = enterPose(item.href, pos);
      const DURATION = 1000;
      flyRef.current = {
        fromPos: new THREE.Vector3(),
        fromLook: new THREE.Vector3(),
        toPos: enter.pos,
        toLook: enter.look,
        durationMs: DURATION,
        startWall: performance.now(),
        captured: false,
      };
      // Fire the reveal exactly when the camera lands in the window (same as the
      // fly duration) so the screen is already full yellow — no brick→yellow pop.
      drive(DURATION, undefined, () => handleArrive(item.href));
    },
    [drive, handleArrive],
  );

  // "Back to castle" intro: if we arrived from a content page (wiz:from), start
  // the camera zoomed in on that page's structure (inside its window) and settle
  // at that tower's head-on front pose — the same spot the scroll tour frames it.
  // We also seed descendRef to that tour stop so the idle tour HOLDS there (rather
  // than dragging the camera back to the wide view) and so scrolling resumes from
  // this tower instead of snapping.
  React.useEffect(() => {
    let from: string | null = null;
    try {
      from = sessionStorage.getItem("wiz:from");
      if (from) sessionStorage.removeItem("wiz:from");
    } catch {
      /* ignore */
    }
    const s = from ? STRUCTURE_BY_ROUTE[from] : undefined;
    if (!s) return;
    const enter = enterPose(from!, new THREE.Vector3(s.c[0], s.c[1], s.c[2]));
    const stop = TOUR_STOP_BY_ROUTE[from!] ?? TOUR.length - 1;
    const rest = TOUR[stop];
    descendRef.current = stop / (TOUR.length - 1);
    const HOLD = 150; // brief beat inside the window, then ease out to the front pose
    const SETTLE = 700;
    flyRef.current = {
      fromPos: enter.pos,
      fromLook: enter.look,
      toPos: rest.pos.clone(),
      toLook: rest.look.clone(),
      durationMs: SETTLE,
      holdMs: HOLD,
      startWall: performance.now(),
      captured: true, // intro uses its preset (zoomed-in) pose
      intro: true,
    };
    // Keep frames flowing through the hold + settle, then release to the idle tour
    // (which now holds this stop because descendRef points at it).
    drive(HOLD + SETTLE, undefined, () => {
      flyRef.current = null;
    });
  }, [drive, descendRef]);

  // Demand mode: render a few frames after mount so the scene paints once the
  // canvas has sized, even with no pointer/scroll interaction yet.
  React.useEffect(() => {
    invalidate();
    const timers = [60, 160, 350, 700, 1200].map((ms) =>
      setTimeout(() => invalidate(), ms),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // Each physical structure picks its nav item by route, so the navItems array
  // order (the header nav order) stays independent of the castle layout.
  const byHref = (href: string) => items.find((it) => it.href === href);
  const greatHall = byHref("/great-hall");
  const owlery = byHref("/contact");

  return (
    <>
      <color attach="background" args={[theme.bg]} />
      {/* Low-lying exponential fog for the misty cliff base */}
      <fogExp2 attach="fog" args={[theme.bgSunken, fogDensity]} />

      <ambientLight intensity={0.3} />
      <directionalLight
        position={[8, 12, -2]}
        intensity={1.6}
        color="#dbe2ff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={45}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-10, 6, 8]} intensity={0.35} color="#8a93c0" />
      <pointLight
        position={[-2, 5, 5]}
        intensity={16}
        distance={30}
        color={theme.accentGlow}
      />

      <Stars
        radius={90}
        depth={45}
        count={1400}
        factor={3.2}
        saturation={0}
        fade
        speed={0.5}
      />
      {/* Night atmosphere — behind/around the castle */}
      <Mountains />
      <NightClouds />
      <Fireflies />
      <Water />
      <LeftCliff />
      <RightCliff />
      <Viaduct position={[0, 0, 2.5]} />
      {/* The two rectangular deck towers — standalone (NOT children of the bridge,
          so moving the bridge never drags them), set back toward the castle. */}
      <DeckWing x={-1.65} z={-0.5} rotation={[0, 0.2, 0]} deckTop={BRIDGE_BOTTOM + LOWER_TIER_H + UPPER_TIER_H + 0.18} width={3.7} height={2.2} />
      <DeckWing x={2} z={-0.45} rotation={[0, -0.3, 0]} deckTop={BRIDGE_BOTTOM + LOWER_TIER_H + UPPER_TIER_H + 0.18} width={3.5} height={1.5} />
      {/* Rock beneath those towers so they don't float. */}
      <Rock position={[-0.55, -1.68, -0.5]} scale={[7, 2.0, 2]} color={ROCK} />

      <CameraRig flyRef={flyRef} descendRef={descendRef} />
      {DEV_ORBIT && (
        <OrbitControls makeDefault enableDamping={false} target={[0, 1.5, 0]} />
      )}
      <CastleBackdrop />

      {/* Great Hall = an interactive BUILDING (home), far left */}
      {greatHall && (
        <GreatHallBuilding
          item={greatHall}
          position={[-7, LEFT_TOP, -2]}
          descendRef={descendRef}
          onSelect={handleSelect}
        />
      )}

      {/* Courtyard between the Great Hall complex and the start of the viaduct */}
      <Courtyard position={[-6.5, LEFT_TOP, 2]} rotation={[0, 0.3, 0]} />

      {/* The cylindrical nav towers (Ask the Sorting Hat / Potions / Library) */}
      {TOWERS.map((t) => {
        const item = byHref(t.href);
        return item ? (
          <Tower
            key={t.href}
            item={item}
            theme={theme}
            position={t.position}
            height={t.height}
            radius={t.radius}
            winFs={t.windows}
            extendIntoCone={t.extendIntoCone}
            descendRef={descendRef}
            onSelect={handleSelect}
          />
        ) : null;
      })}

      {/* The Owlery (Contact) — a tall slim tower behind About */}
      {owlery && (
        <Owlery
          item={owlery}
          position={[5.0, RIGHT_TOP, -0.4]}
          descendRef={descendRef}
          onSelect={handleSelect}
        />
      )}

      <EffectComposer>
        <Bloom
          intensity={0.9}
          luminanceThreshold={0.32}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

/* ============================================================================
   Decorative (non-interactive) structures — all anchored on plateau tops.
   ============================================================================ */
function CastleBackdrop() {
  return (
    <group>
      {/* ---- Left plateau ---- */}
      {/* Structure 4: Connecting Hall behind the Astronomy tower, toward the bridge */}
      <group position={[-2.8, LEFT_TOP, -2.3]}>
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[2.4, 2, 2.2]} />
          <meshStandardMaterial color={WHITE_DK} roughness={0.85} map={brickTexture()} />
        </mesh>
        <mesh position={[0, 2.05, 0]}>
          <boxGeometry args={[2.6, 0.18, 2.4]} />
          <meshStandardMaterial color={SLATE_DK} roughness={0.8} map={roofTexture()} />
        </mesh>
        <Glow position={[0.7, 1.0, 1.12]} />
        <Glow position={[-0.7, 1.0, 1.12]} />
      </group>

      {/* ---- Right plateau ---- */}
      {/* Structures 6 & 7: Twin purple spires (staggered, background) */}
      <Spire
        position={[3.7, RIGHT_TOP, -2.2]}
        radius={0.34}
        height={4.0}
        body={PURPLE}
        roof={SLATE_DK}
      />
      <Spire
        position={[4.6, RIGHT_TOP, -2.6]}
        radius={0.32}
        height={3.2}
        body={PURPLE}
        roof={SLATE_DK}
      />
      {/* Structure 8: small hidden grey spire between them */}
      <Spire
        position={[4.15, RIGHT_TOP, -2.5]}
        radius={0.16}
        height={2.6}
        body={WHITE_DK}
        roof={SLATE}
      />

      {/* Structure 10: Right wing buildings (connected palace blocks) */}
      <GableHall
        position={[7.2, RIGHT_TOP, -0.7]}
        rotation={[0, -0.25, 0]}
        width={2.1}
        depth={3.0}
        height={1.9}
        windows={4}
        ridgeSpireCount={3}
        steep={0.5}
        coverFront
        coverBack
      />
      <GableHall
        position={[8.7, RIGHT_TOP, -0.5]}
        rotation={[0, -0.25, 0]}
        width={1.7}
        depth={2.3}
        height={1.6}
        windows={3}
        ridgeSpireCount={2}
        steep={0.5}
        coverFront
        coverBack
      />

      {/* Structure 11: Far-right square turret with a pyramidal cap */}
      <group position={[9.7, RIGHT_TOP, -0.4]}>
        <mesh position={[0, 1.0, 0]}>
          <boxGeometry args={[0.7, 2.0, 0.7]} />
          <meshStandardMaterial color={WHITE_DK} roughness={0.85} map={brickTexture()} />
        </mesh>
        <mesh position={[0, 2.4, 0]}>
          <coneGeometry args={[0.6, 0.8, 4]} />
          <meshStandardMaterial color={SLATE} roughness={0.7} map={roofTexture()} />
        </mesh>
        <Glow position={[0, 1.2, 0.36]} size={[0.08, 0.4, 0.05]} />
      </group>

    </group>
  );
}

/* ============================================================================
   The Great Hall — an interactive BUILDING (home). Long gabled hall with ridge
   spires + an attached tower on its front end. Label points to the building.
   ============================================================================ */
function GreatHallBuilding({
  item,
  position,
  descendRef,
  onSelect,
}: {
  item: NavItem;
  position: Vec3;
  descendRef: React.MutableRefObject<number>;
  onSelect: (item: NavItem, pos: THREE.Vector3) => void;
}) {
  const [meshHover, setMeshHover] = React.useState(false);
  const [htmlHover, setHtmlHover] = React.useState(false);
  // Split hover sources: the 3D mesh (onPointerOver) and the DOM label/pin
  // (onPointerEnter) each own a flag, OR'd — so the mesh's onPointerOut can't
  // clobber a live label/pin hover, and vice-versa. Hover any part → lit.
  const hovered = meshHover || htmlHover;
  useCursor(hovered);
  React.useEffect(() => {
    invalidate();
  }, [hovered]);

  // Collect the hall's window materials so they brighten on hover (like a tower).
  const winRefs = React.useRef<THREE.MeshStandardMaterial[]>([]);
  const registerWindow = React.useCallback((m: THREE.MeshStandardMaterial | null) => {
    if (m && !winRefs.current.includes(m)) winRefs.current.push(m);
  }, []);
  useFrame(() => {
    const near = frontPoseNearness(item.href, descendRef.current);
    const target = frontPosePulse(near, hovered ? 3.4 : 1.4);
    let moving = false;
    for (const m of winRefs.current) {
      if (!m) continue;
      const d = target - m.emissiveIntensity;
      m.emissiveIntensity += d * 0.2;
      if (Math.abs(d) > 0.01) moving = true;
    }
    if (near > 0) moving = true; // keep the pulse animating in demand mode
    if (moving) invalidate();
  });

  const width = 2.6;
  const depth = 5.6;
  const height = 2.5;
  const rh = width * 0.75;

  // Label beside the window the camera flies into, on its left (camera POV).
  const entry = STRUCTURE_BY_ROUTE[item.href];
  const labelPos: Vec3 = entry
    ? [
        entry.c[0] + entry.win[0] - position[0],
        entry.c[1] + entry.win[1] - position[1] + LABEL_LIFT,
        entry.c[2] + entry.win[2] - position[2] + 0.2,
      ]
    : [0, height * 0.8 + LABEL_LIFT, depth / 2 + 0.2];

  return (
    <group
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setMeshHover(true);
      }}
      onPointerOut={() => setMeshHover(false)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(item, new THREE.Vector3(position[0], position[1], position[2]));
      }}
    >
      {/* Slant the long hall: pivot at its front edge so the BACK swings to the
          left (-x, camera POV). The front tower stays put (keeps its window). */}
      <group position={[0, 0, depth / 2]} rotation={[0, 0.3, 0]}>
        <GableHall
          position={[0, 0, -depth / 2]}
          width={width}
          depth={depth}
          height={height}
          windows={6}
          ridgeSpireCount={0}
          steep={0.75}
          coverFront
          bothSides
          registerWindow={registerWindow}
        />
        {/* three very thin turrets along the roof ridge: front, middle, back */}
        <Spire position={[0, height + rh - 0.15, -0.1]} radius={0.13} height={0.7} body={WHITE} roof={SLATE} />
        <Spire position={[0, height + rh - 0.15, -depth / 2]} radius={0.2} height={0.9} body={WHITE} roof={SLATE} />
        <Spire position={[0, height + rh - 0.15, -depth + 0.1]} radius={0.13} height={0.7} body={WHITE} roof={SLATE} />
      </group>
      {/* tower connected to the front end of the hall */}
      <DecoTower
        position={[0, 0, depth / 2 + 0.1]}
        radius={0.55}
        height={height + 0.8}
        body={WHITE}
        roof={SLATE}
        crenel
        windows={2}
        registerWindow={registerWindow}
        rotation={[0, 0.4, 0]}
      />

      <Html position={labelPos} center distanceFactor={22} zIndexRange={[20, 0]}>
        <button
          type="button"
          onClick={() =>
            onSelect(item, new THREE.Vector3(position[0], position[1], position[2]))
          }
          onPointerEnter={() => setHtmlHover(true)}
          onPointerLeave={() => setHtmlHover(false)}
          aria-label="Enter the Great Hall"
          className={`pointer-events-auto whitespace-nowrap text-xs font-semibold [text-shadow:0_1px_10px_rgba(0,0,0,0.95)] transition-colors hover:text-foreground focus-visible:outline-none ${
            hovered ? "text-foreground" : "text-accent-text"
          }`}
        >
          {item.tower}
        </button>
      </Html>
    </group>
  );
}

/* ============================================================================
   The Courtyard — a flat, cloister-bordered quadrangle on the left plateau,
   between the Great Hall complex and the start of the viaduct (the bridgehead).
   ============================================================================ */
function Courtyard({
  position,
  rotation = [0, 0, 0] as Vec3,
  w = 2.5,
  d = 4.2,
}: {
  position: Vec3;
  rotation?: Vec3;
  w?: number;
  d?: number;
}) {
  const colH = 0.45; // covered-walkway height
  const hw = w / 2;
  const hd = d / 2;
  const pillar = (x: number, z: number, key: string) => (
    <mesh key={key} position={[x, colH / 2, z]}>
      <boxGeometry args={[0.12, colH, 0.12]} />
      <meshStandardMaterial color={WHITE} roughness={0.85} map={brickTexture()} />
    </mesh>
  );
  const pillars: React.ReactNode[] = [];
  const nz = 14;
  const nx = 10;
  for (let i = 0; i < nz; i++) {
    const z = -hd + (d / (nz - 1)) * i;
    pillars.push(pillar(-hw, z, `l${i}`), pillar(hw, z, `r${i}`));
  }
  for (let i = 1; i < nx - 1; i++) {
    const x = -hw + (w / (nx - 1)) * i;
    pillars.push(pillar(x, -hd, `b${i}`), pillar(x, hd, `f${i}`));
  }
  return (
    <group position={position} rotation={rotation}>
      {/* flat quadrangle floor */}
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[w, 0.06, d]} />
        <meshStandardMaterial color={WHITE} roughness={0.95} map={rockTexture()} />
      </mesh>
      {/* cloister colonnade — rows of small open bays framing the quad */}
      {pillars}
      {/* covered-walkway roof strips around the border */}
      <mesh position={[-hw, colH + 0.05, 0]}>
        <boxGeometry args={[0.34, 0.08, d + 0.12]} />
        <meshStandardMaterial color={WHITE} roughness={0.7} map={roofTexture()} />
      </mesh>
      <mesh position={[hw, colH + 0.05, 0]}>
        <boxGeometry args={[0.34, 0.08, d + 0.12]} />
        <meshStandardMaterial color={WHITE} roughness={0.7} map={roofTexture()} />
      </mesh>
      <mesh position={[0, colH + 0.05, -hd]}>
        <boxGeometry args={[w, 0.08, 0.34]} />
        <meshStandardMaterial color={WHITE} roughness={0.7} map={roofTexture()} />
      </mesh>
      <mesh position={[0, colH + 0.05, hd]}>
        <boxGeometry args={[w, 0.08, 0.34]} />
        <meshStandardMaterial color={WHITE} roughness={0.7} map={roofTexture()} />
      </mesh>
    </group>
  );
}

/* ============================================================================
   Camera controller
   ============================================================================ */
function CameraRig({
  flyRef,
  descendRef,
}: {
  flyRef: React.MutableRefObject<FlyTarget>;
  descendRef: React.MutableRefObject<number>;
}) {
  const gl = useThree((s) => s.gl);
  const pointer = React.useRef({ x: 0, y: 0 });
  const look = React.useRef(WIDE_LOOK.clone());
  const desiredPos = React.useRef(new THREE.Vector3());
  const desiredLook = React.useRef(new THREE.Vector3());
  const wideResp = React.useRef(new THREE.Vector3());
  React.useEffect(() => {
    const el = gl.domElement;
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      pointer.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.current.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      invalidate();
    };
    el.addEventListener("pointermove", onMove, { passive: true });
    return () => el.removeEventListener("pointermove", onMove);
  }, [gl]);

  useFrame((state) => {
    if (DEV_ORBIT) return; // dev: OrbitControls drives the camera instead
    const cam = state.camera;
    let moving = false;
    const fly = flyRef.current;

    if (fly) {
      // Forward warp starts from the current camera; the intro uses its preset
      // (zoomed-in) pose. Progress is wall-clock so dropped frames (while the
      // canvas is filtered) never desync it. The ripple + navigation are driven
      // separately by drive(), so nothing here needs to detect the end.
      if (!fly.captured) {
        fly.fromPos.copy(cam.position);
        fly.fromLook.copy(look.current);
        fly.captured = true;
      }
      const elapsed = performance.now() - fly.startWall - (fly.holdMs ?? 0);
      const t = clamp01(elapsed / fly.durationMs);
      const e = easeInOut(t);
      cam.position.lerpVectors(fly.fromPos, fly.toPos, e);
      look.current.lerpVectors(fly.fromLook, fly.toLook, e);
      moving = true;
    } else {
      // Scroll TOUR: map scroll (descendRef 0→1) across the TOUR poses. Each
      // segment eases in/out, so the camera settles on a pose (zoom-in or the
      // pull-back) before flowing to the next.
      const d = clamp01(descendRef.current);
      const N = TOUR.length;
      const p = d * (N - 1);
      const i = Math.min(Math.floor(p), N - 2);
      const t = easeInOut(p - i);
      // Wide endpoints (stops 0 and N-1) dolly back on narrow/portrait screens so
      // the whole castle fits; tower front poses are unaffected.
      const dolly = viewportDolly(state.size.width, state.size.height);
      wideResp.current.set(
        WIDE_LOOK.x + (WIDE_POS.x - WIDE_LOOK.x) * dolly,
        WIDE_POS.y + (dolly - 1) * 1.5,
        WIDE_LOOK.z + (WIDE_POS.z - WIDE_LOOK.z) * dolly,
      );
      const startPos = i === 0 ? wideResp.current : TOUR[i].pos;
      const endPos = i + 1 === N - 1 ? wideResp.current : TOUR[i + 1].pos;
      desiredPos.current.lerpVectors(startPos, endPos, t);
      desiredLook.current.lerpVectors(TOUR[i].look, TOUR[i + 1].look, t);
      // gentle pointer parallax, only on the opening wide shot (fades by stop 1)
      const par = Math.max(0, 1 - p);
      desiredPos.current.x += pointer.current.x * 1.2 * par;
      desiredPos.current.y += pointer.current.y * 0.4 * par;
      cam.position.lerp(desiredPos.current, 0.2);
      look.current.lerp(desiredLook.current, 0.2);
      if (cam.position.distanceTo(desiredPos.current) > 0.005) moving = true;
    }

    cam.lookAt(look.current);
    if (moving) invalidate();
  });

  return null;
}

/* ============================================================================
   Interactive nav tower
   ============================================================================ */
function Tower({
  item,
  position,
  height,
  radius,
  theme,
  onSelect,
  descendRef,
  winFs = [0.34, 0.5, 0.66, 0.82],
  extendIntoCone = false,
}: {
  item: NavItem;
  position: Vec3;
  height: number;
  radius: number;
  theme: CastleTheme;
  onSelect: (item: NavItem, pos: THREE.Vector3) => void;
  /** Scroll-tour progress [0,1); used to pulse windows at this tower's front pose. */
  descendRef: React.MutableRefObject<number>;
  /** Window heights as fractions of the tower height. [] = no windows. */
  winFs?: number[];
  /** Push the body cylinder up into the cone so no gap shows at the eaves. */
  extendIntoCone?: boolean;
}) {
  const [meshHover, setMeshHover] = React.useState(false);
  const [htmlHover, setHtmlHover] = React.useState(false);
  // Split hover sources: the 3D mesh (onPointerOver) and the DOM label/pin
  // (onPointerEnter) each own a flag, OR'd — so the mesh's onPointerOut can't
  // clobber a live label/pin hover, and vice-versa. Hover any part → lit.
  const hovered = meshHover || htmlHover;
  useCursor(hovered);

  const roofRef = React.useRef<THREE.MeshStandardMaterial>(null);
  const winRefs = React.useRef<THREE.MeshStandardMaterial[]>([]);
  const coneH = radius * 3;
  // When set, the body grows past the wall top so its rim tucks inside the cone.
  const bodyH = height + (extendIntoCone ? radius * 0.55 : 0);

  React.useEffect(() => {
    invalidate();
  }, [hovered]);

  useFrame(() => {
    const roofTarget = 0; // cones stay dark gray — no hover glow
    const near = frontPoseNearness(item.href, descendRef.current);
    const winTarget = frontPosePulse(near, hovered ? 3.2 : 1.2);
    let moving = false;
    if (roofRef.current) {
      const d = roofTarget - roofRef.current.emissiveIntensity;
      roofRef.current.emissiveIntensity += d * 0.15;
      if (Math.abs(d) > 0.01) moving = true;
    }
    for (const m of winRefs.current) {
      if (!m) continue;
      const d = winTarget - m.emissiveIntensity;
      m.emissiveIntensity += d * 0.25;
      if (Math.abs(d) > 0.01) moving = true;
    }
    if (near > 0) moving = true; // keep the pulse animating in demand mode
    if (moving) invalidate();
  });

  const select = (e?: ThreeEvent<MouseEvent>) => {
    e?.stopPropagation();
    onSelect(item, new THREE.Vector3(position[0], position[1], position[2]));
  };

  // Label sits beside the window the camera flies into, on its left (camera POV).
  // STRUCTURE_BY_ROUTE.win is an offset from its `c`; re-base into tower-local.
  const entry = STRUCTURE_BY_ROUTE[item.href];
  // Label sits ON TOP of the window the camera flies into (centred on it in X,
  // raised in Y by LABEL_LIFT). Raise/lower LABEL_LIFT to move it up/down.
  const labelPos: Vec3 = entry
    ? [
        entry.c[0] + entry.win[0] - position[0],
        entry.c[1] + entry.win[1] - position[1] + LABEL_LIFT,
        entry.c[2] + entry.win[2] - position[2] - 0.2,
      ]
    : [0, height * 0.7 + LABEL_LIFT, radius + 0.2];

  return (
    <group
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setMeshHover(true);
      }}
      onPointerOut={() => setMeshHover(false)}
      onClick={select}
    >
      <mesh position={[0, bodyH / 2, 0]}>
        <cylinderGeometry args={[radius * 0.86, radius, bodyH, 16]} />
        <meshStandardMaterial
          color={WHITE}
          roughness={0.85}
          metalness={0.04}
          map={brickTexture()}
        />
      </mesh>

      {/* Glowing yellow interior, set well inside the wall (a wide gap) so it
          never bleeds through the brick from outside; fills the view once inside. */}
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[radius * 0.7, radius * 0.82, height * 0.98, 24]} />
        <meshStandardMaterial
          color={WARM}
          emissive={WARM}
          emissiveIntensity={1.2}
          side={THREE.BackSide}
          toneMapped={false}
        />
      </mesh>

      <Crenellations
        radius={radius * 0.92}
        y={height + 0.04}
        count={Math.max(10, Math.round(radius * 18))}
        size={[radius * 0.22, 0.3, radius * 0.22]}
      />

      <mesh position={[0, height + coneH / 2 + 0.1, 0]}>
        <coneGeometry args={[radius * 1.2, coneH, 18]} />
        <meshStandardMaterial
          ref={roofRef}
          color={SLATE}
          map={roofTexture()}
          emissive={theme.accent}
          emissiveIntensity={0}
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>

      {winFs.map((f, i) => {
        // Match the cylinder's taper (radiusTop = radius*0.86) so every window
        // sits flush on the wall instead of embedding (the low ones looked chipped).
        const localR = radius * (1 - 0.14 * f);
        return (
          <mesh key={i} position={[0, height * f, localR - 0.01]}>
            <boxGeometry args={[0.18, 0.42, 0.06]} />
            <meshStandardMaterial
              ref={(m) => {
                if (m) winRefs.current[i] = m;
              }}
              color={WARM}
              emissive={WARM}
              emissiveIntensity={1.2}
              toneMapped={false}
            />
          </mesh>
        );
      })}
      {[-0.3, -0.1, 0.1, 0.3].map((x, i) => (
        <Glow
          key={i}
          position={[x, height * 0.22, radius * 0.94]}
          size={[0.07, 0.07, 0.05]}
          intensity={1}
        />
      ))}

      <Html position={labelPos} center distanceFactor={22} zIndexRange={[20, 0]}>
        <button
          type="button"
          onClick={() => select()}
          onPointerEnter={() => setHtmlHover(true)}
          onPointerLeave={() => setHtmlHover(false)}
          aria-label={`Go to ${item.tower}`}
          className={`pointer-events-auto whitespace-nowrap text-xs font-semibold [text-shadow:0_1px_10px_rgba(0,0,0,0.95)] transition-colors hover:text-foreground focus-visible:outline-none ${
            hovered ? "text-foreground" : "text-accent-text"
          }`}
        >
          {item.tower}
        </button>
      </Html>

      {/* Bright pulsing map indicator above the Sorting Hat tower's label. */}
      {item.href === "/sorting-hat" && (
        <Html
          position={[labelPos[0], labelPos[1] + 1, labelPos[2]]}
          center
          distanceFactor={22}
          zIndexRange={[40, 0]}
        >
          <button
            type="button"
            onClick={() => select()}
            onPointerEnter={() => setHtmlHover(true)}
            onPointerLeave={() => setHtmlHover(false)}
            aria-label={`Enter ${item.tower}`}
            className="pointer-events-auto relative grid size-6 place-items-center"
          >
            {/* pulsing ring */}
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#ffd54a] opacity-60 motion-reduce:animate-none" />
            {/* solid pin with the Sorting Hat silhouette */}
            <span className="relative grid size-6 place-items-center rounded-full bg-[#ffd54a] shadow-[0_0_18px_5px_rgba(255,213,74,0.8)] ring-2 ring-[#fff2b0]">
              <HatSilhouette className="size-4 text-[#241a10]" />
            </span>
          </button>
        </Html>
      )}
    </group>
  );
}

/* ============================================================================
   The Owlery — interactive nav tower (Contact). Tall & slim with a conical roof,
   battlements, a single high window just under the roof, and a small side turret
   (viewer's right) with its own cone. Sits behind the About tower.
   ============================================================================ */
function Owlery({
  item,
  position,
  descendRef,
  onSelect,
}: {
  item: NavItem;
  position: Vec3;
  descendRef: React.MutableRefObject<number>;
  onSelect: (item: NavItem, pos: THREE.Vector3) => void;
}) {
  const [meshHover, setMeshHover] = React.useState(false);
  const [htmlHover, setHtmlHover] = React.useState(false);
  // Split hover sources: the 3D mesh (onPointerOver) and the DOM label/pin
  // (onPointerEnter) each own a flag, OR'd — so the mesh's onPointerOut can't
  // clobber a live label/pin hover, and vice-versa. Hover any part → lit.
  const hovered = meshHover || htmlHover;
  useCursor(hovered);
  const winRef = React.useRef<THREE.MeshStandardMaterial>(null);

  React.useEffect(() => {
    invalidate();
  }, [hovered]);

  useFrame(() => {
    const m = winRef.current;
    if (!m) return;
    const near = frontPoseNearness(item.href, descendRef.current);
    const target = frontPosePulse(near, hovered ? 3.2 : 1.2);
    const d = target - m.emissiveIntensity;
    m.emissiveIntensity += d * 0.25;
    if (Math.abs(d) > 0.01 || near > 0) invalidate();
  });

  const radius = 0.5; // slimmer than About (0.8)
  const height = 6.9; // taller than About (3.4) / Great Hall, shorter than Projects (5.2)
  const coneH = radius * 2.7;
  const bodyH = height + radius * 0.55; // body grows up so its rim tucks inside the cone (no gap at eaves)
  const winF = 0.85; // window high up, just below the roof
  const winLocalR = radius * (1 - 0.14 * winF); // sit flush on the tapered wall

  // small side turret on the viewer's right (+x), near the top
  const tR = 0.15;
  const tH = 4.8; // taller than the main tower so its top clears it from the camera POV
  const tConeH = tR * 2.6;

  const select = (e?: ThreeEvent<MouseEvent>) => {
    e?.stopPropagation();
    onSelect(item, new THREE.Vector3(position[0], position[1], position[2]));
  };

  // Label beside the high window the camera flies into, on its left (camera POV).
  const labelPos: Vec3 = [0, height * winF + LABEL_LIFT, winLocalR + 0.2];

  return (
    <group
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setMeshHover(true);
      }}
      onPointerOut={() => setMeshHover(false)}
      onClick={select}
    >
      {/* body */}
      <mesh position={[0, bodyH / 2, 0]}>
        <cylinderGeometry args={[radius * 0.86, radius, bodyH, 16]} />
        <meshStandardMaterial
          color={WHITE}
          roughness={0.85}
          metalness={0.04}
          map={brickTexture()}
        />
      </mesh>

      {/* glowing yellow interior (fills the view once the camera is inside) */}
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[radius * 0.7, radius * 0.82, height * 0.98, 20]} />
        <meshStandardMaterial
          color={WARM}
          emissive={WARM}
          emissiveIntensity={1.2}
          side={THREE.BackSide}
          toneMapped={false}
        />
      </mesh>

      {/* battlements */}
      <Crenellations
        radius={radius * 0.92}
        y={height + 0.04}
        count={Math.max(8, Math.round(radius * 18))}
        size={[radius * 0.22, 0.3, radius * 0.22]}
      />

      {/* conical roof */}
      <mesh position={[0, height + coneH / 2 + 0.1, 0]}>
        <coneGeometry args={[radius * 1.2, coneH, 18]} />
        <meshStandardMaterial
          color={SLATE}
          map={roofTexture()}
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>

      {/* the single high window — front (+z) face, just below the roof */}
      <mesh position={[0, height * winF, winLocalR - 0.02]}>
        <boxGeometry args={[0.16, 0.4, 0.06]} />
        <meshStandardMaterial
          ref={winRef}
          color={WARM}
          emissive={WARM}
          emissiveIntensity={1.2}
          toneMapped={false}
        />
      </mesh>

      {/* small side turret (viewer's right) — rises above the main tower so it's
          visible from the camera POV (its body is on the far +x side). */}
      <group position={[radius * 0.92, height + 1.6 - tH / 2, 0]}>
        <mesh>
          <cylinderGeometry args={[tR, tR, tH, 12]} />
          <meshStandardMaterial color={WHITE} roughness={0.85} map={brickTexture()} />
        </mesh>
        <mesh position={[0, tH / 2 + tConeH / 2 + 0.04, 0]}>
          <coneGeometry args={[tR * 1.3, tConeH, 12]} />
          <meshStandardMaterial
            color={SLATE}
            map={roofTexture()}
            roughness={0.6}
            metalness={0.2}
          />
        </mesh>
      </group>

      <Html position={labelPos} center distanceFactor={22} zIndexRange={[20, 0]}>
        <button
          type="button"
          onClick={() => select()}
          onPointerEnter={() => setHtmlHover(true)}
          onPointerLeave={() => setHtmlHover(false)}
          aria-label={`Go to ${item.tower}`}
          className={`pointer-events-auto whitespace-nowrap text-xs font-semibold [text-shadow:0_1px_10px_rgba(0,0,0,0.95)] transition-colors hover:text-foreground focus-visible:outline-none ${
            hovered ? "text-foreground" : "text-accent-text"
          }`}
        >
          {item.tower}
        </button>
      </Html>
    </group>
  );
}
