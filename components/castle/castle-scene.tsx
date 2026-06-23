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
import { Html, Stars, useCursor } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

import type { NavItem } from "@/lib/types";
import { readCastleTheme, type CastleTheme } from "@/lib/tokens";
import { useEnterReveal } from "@/components/page-reveal";

type Vec3 = [number, number, number];

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

/* Interactive nav towers (Projects/About/Resume). Index 0 (Great Hall) is a
   building, handled separately; Contact lives in the header nav. Each tower
   sits on its plateau top. */
const TOWERS: { position: Vec3; height: number; radius: number }[] = [
  { position: [-4.0, LEFT_TOP, -0.3], height: 5.2, radius: 1.15 }, // Projects — Main Astronomy Tower (tallest, thickest)
  { position: [5.6, RIGHT_TOP, 0.4], height: 3.4, radius: 0.8 }, // About — Main Right Tower
  { position: [2.4, RIGHT_TOP, 0.7], height: 2.7, radius: 0.62 }, // Resume — Castellated Bridge Tower
];

// Route → its structure. `win` = offset (from the plateau-base center `c`) of an
// actual LIT window; `cam` = where the camera ends relative to that window. All
// windows here sit on the front (+z) face, so the camera flies straight in.
// Used to fly INTO the window (forward) and to start the "back to castle" intro.
const STRUCTURE_BY_ROUTE: Record<string, { c: Vec3; win: Vec3; cam: Vec3 }> = {
  // Great Hall — the window on the front tower (DecoTower at z = depth/2 + 0.1).
  "/great-hall": { c: [-6.6, LEFT_TOP, 0.3], win: [0, 1.4, 3.41], cam: [0, 0, 0.22] },
  // Towers — a mid window on the front face (y = height*0.5, z = radius*0.92).
  "/projects": { c: [-4.0, LEFT_TOP, -0.3], win: [0, 2.6, 1.06], cam: [0, 0, 0.22] },
  "/about": { c: [5.6, RIGHT_TOP, 0.4], win: [0, 1.7, 0.74], cam: [0, 0, 0.2] },
  "/resume": { c: [2.4, RIGHT_TOP, 0.7], win: [0, 1.35, 0.57], cam: [0, 0, 0.18] },
  "/contact": { c: [1.2, WATER_Y + 0.6, 3.4], win: [0, 0.5, 0.8], cam: [0, 0, 0.32] },
};

/** Camera pose that flies INTO a structure's lit window (close up). */
function enterPose(href: string, center: THREE.Vector3) {
  const s = STRUCTURE_BY_ROUTE[href];
  const w = s ? s.win : [0, 2, 1];
  const cam = s ? s.cam : [0, 0, 1.2];
  const win = new THREE.Vector3(center.x + w[0], center.y + w[1], center.z + w[2]);
  return {
    look: win,
    pos: new THREE.Vector3(win.x + cam[0], win.y + cam[1], win.z + cam[2]),
  };
}

// Camera: low, three-quarter front-LEFT (left close & prominent, right recedes).
const WIDE_POS = new THREE.Vector3(-11, 2.6, 15.5);
const WIDE_LOOK = new THREE.Vector3(1, 4, -2);
// The scroll "dive" flies into the Great Hall's window (left).
const GREAT_HALL_ENTER = enterPose("/great-hall", new THREE.Vector3(-6.6, LEFT_TOP, 0.3));
const DIVE_POS = GREAT_HALL_ENTER.pos;
const DIVE_LOOK = GREAT_HALL_ENTER.look;

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

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

const BRIDGE_DEPTH = 1.4;
const BRIDGE_BOTTOM = -3.0;
const LOWER_TIER = makeArchWall(5, 0.95, 0.42, 2.1); // five tall open arches
const UPPER_TIER = makeArchWall(10, 0.42, 0.22, 0.9);
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
}) {
  const coneH = radius * 2.6;
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[radius * 0.9, radius, height, 14]} />
        <meshStandardMaterial color={body} roughness={0.85} map={brickTexture()} />
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
        <coneGeometry args={[radius * 1.2, radius * 3.2, 12]} />
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
      {/* horizontal window row along the side(s) */}
      {Array.from({ length: windows }).map((_, i) => {
        const z = -depth / 2 + (depth / (windows + 1)) * (i + 1);
        return (
          <React.Fragment key={i}>
            <Glow
              position={[width / 2 + 0.03, height * 0.5, z]}
              size={[0.06, 0.5, 0.18]}
              register={registerWindow}
            />
            {bothSides && (
              <Glow
                position={[-width / 2 - 0.03, height * 0.5, z]}
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

function ArchDoor({
  position,
  width = 0.8,
  height = 1.3,
  color = "#5b4bd6",
  intensity = 1.1,
  rotation,
}: {
  position: Vec3;
  width?: number;
  height?: number;
  color?: string;
  intensity?: number;
  rotation?: Vec3;
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, 0.1]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={intensity}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[width / 2, width / 2, 0.1, 16, 1, false, 0, Math.PI]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={intensity}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function Rock({
  position,
  scale,
  color = ROCK,
}: {
  position: Vec3;
  scale: Vec3;
  color?: string;
}) {
  return (
    <mesh position={position} scale={scale}>
      <icosahedronGeometry args={[1, 1]} />
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
      <Plateau cx={-5} cz={-0.4} top={LEFT_TOP} rTop={3.5} rBot={4.6} color={ROCK} />
      {/* craggy accents on the flanks */}
      <Rock position={[-7.6, -1.4, -0.2]} scale={[1.7, 2.8, 1.7]} color={ROCK_DK} />
      <Rock position={[-2.4, -1.6, 0.6]} scale={[1.4, 2.6, 1.4]} color={ROCK_LT} />
      {/* tall jagged peaks rising behind the buildings */}
      <Rock position={[-6.6, 0.6, -2.8]} scale={[1.5, 2.8, 1.4]} color={ROCK_DK} />
      <Rock position={[-4.4, 0.3, -3.2]} scale={[1.3, 2.4, 1.3]} color={ROCK} />
    </group>
  );
}

/** Right landmass — lower, broad, flatter; flat top at RIGHT_TOP. */
function RightCliff() {
  return (
    <group>
      <Plateau cx={5.6} cz={-0.4} top={RIGHT_TOP} rTop={4.0} rBot={4.9} color={ROCK} />
      <Rock position={[8.8, -1.6, -0.2]} scale={[1.6, 2.4, 1.6]} color={ROCK_DK} />
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
}: {
  x: number;
  deckTop: number;
  width: number;
  height: number;
  depth?: number;
}) {
  const winCount = Math.max(2, Math.round(width / 0.95));
  const rise = depth * 0.6;
  const hd = depth / 2;
  const slope = Math.sqrt(hd * hd + rise * rise);
  const ang = Math.atan2(rise, hd);
  return (
    <group position={[x, deckTop, 0]}>
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
      <mesh position={[-UPPER_TIER.totalW / 2, BRIDGE_BOTTOM + 2.1, -BRIDGE_DEPTH / 2]}>
        <extrudeGeometry args={[UPPER_TIER.shape, EXTRUDE]} />
        <meshStandardMaterial color={BRIDGE} roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, BRIDGE_BOTTOM + 2.1 + 0.9 + 0.09, 0]}>
        <boxGeometry args={[LOWER_TIER.totalW + 0.5, 0.18, BRIDGE_DEPTH + 0.6]} />
        <meshStandardMaterial color={BRIDGE} roughness={0.85} map={roofTexture()} />
      </mesh>

      {/* Two wide rectangular wings filling the deck, joining both clusters */}
      <DeckWing
        x={-1.7}
        deckTop={BRIDGE_BOTTOM + 2.1 + 0.9 + 0.18}
        width={3.7}
        height={2.2}
      />
      <DeckWing
        x={1.8}
        deckTop={BRIDGE_BOTTOM + 2.1 + 0.9 + 0.18}
        width={3.5}
        height={1.5}
      />
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
      gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
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
  const driveRef = React.useRef<number | null>(null);

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
  React.useEffect(() => {
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
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
      const DURATION = 1900;
      flyRef.current = {
        fromPos: new THREE.Vector3(),
        fromLook: new THREE.Vector3(),
        toPos: enter.pos,
        toLook: enter.look,
        durationMs: DURATION,
        startWall: performance.now(),
        captured: false,
      };
      drive(DURATION, undefined, () => handleArrive(item.href));
    },
    [drive, handleArrive],
  );

  // "Back to castle" intro: if we arrived from a content page (wiz:from), start
  // the camera zoomed in on that page's structure, then pull out to the wide view.
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
    const HOLD = 750; // pause on the zoomed-in tower before pulling out
    const ZOOMOUT = 1700;
    flyRef.current = {
      fromPos: enter.pos,
      fromLook: enter.look,
      toPos: WIDE_POS.clone(),
      toLook: WIDE_LOOK.clone(),
      durationMs: ZOOMOUT,
      holdMs: HOLD,
      startWall: performance.now(),
      captured: true, // intro uses its preset (zoomed-in) pose
      intro: true,
    };
    // Keep frames flowing through the hold + pull-out, then release to idle.
    drive(HOLD + ZOOMOUT, undefined, () => {
      flyRef.current = null;
    });
  }, [drive]);

  // Demand mode: render a few frames after mount so the scene paints once the
  // canvas has sized, even with no pointer/scroll interaction yet.
  React.useEffect(() => {
    invalidate();
    const timers = [60, 160, 350, 700, 1200].map((ms) =>
      setTimeout(() => invalidate(), ms),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const navTowers = items.slice(1, 1 + TOWERS.length);

  return (
    <>
      <color attach="background" args={[theme.bg]} />
      {/* Low-lying exponential fog for the misty cliff base */}
      <fogExp2 attach="fog" args={[theme.bgSunken, 0.015]} />

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
      <Water />
      <LeftCliff />
      <RightCliff />
      <Viaduct position={[0, 0, 0.4]} />

      <CameraRig flyRef={flyRef} descendRef={descendRef} />
      <CastleBackdrop />

      {/* Great Hall = an interactive BUILDING (home), far left */}
      {items[0] && (
        <GreatHallBuilding
          item={items[0]}
          position={[-6.6, LEFT_TOP, 0.3]}
          onSelect={handleSelect}
        />
      )}

      {/* The four cylindrical nav towers */}
      {navTowers.map((item, i) => (
        <Tower
          key={item.href}
          item={item}
          theme={theme}
          position={TOWERS[i].position}
          height={TOWERS[i].height}
          radius={TOWERS[i].radius}
          onSelect={handleSelect}
        />
      ))}

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

      {/* The boathouse — at the water's edge in front of the chasm */}
      <group position={[1.2, WATER_Y, 3.4]}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1.4, 1, 1.7]} />
          <meshStandardMaterial color={WHITE} roughness={0.85} map={brickTexture()} />
        </mesh>
        <mesh position={[-0.38, 1.32, 0]} rotation={[0, 0, 0.82]}>
          <boxGeometry args={[1.25, 0.12, 1.8]} />
          <meshStandardMaterial color={SLATE} roughness={0.7} map={roofTexture()} />
        </mesh>
        <mesh position={[0.38, 1.32, 0]} rotation={[0, 0, -0.82]}>
          <boxGeometry args={[1.25, 0.12, 1.8]} />
          <meshStandardMaterial color={SLATE} roughness={0.7} map={roofTexture()} />
        </mesh>
        {/* narrow tower from the peak */}
        <Spire
          position={[0, 1.55, 0.5]}
          radius={0.13}
          height={0.7}
          body={WHITE}
          roof={SLATE}
        />
        <ArchDoor
          position={[0, 0, 0.87]}
          width={0.55}
          height={0.9}
          color={WARM}
          intensity={1.8}
        />
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
  onSelect,
}: {
  item: NavItem;
  position: Vec3;
  onSelect: (item: NavItem, pos: THREE.Vector3) => void;
}) {
  const [hovered, setHovered] = React.useState(false);
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
    const target = hovered ? 2.6 : 1.4;
    let moving = false;
    for (const m of winRefs.current) {
      if (!m) continue;
      const d = target - m.emissiveIntensity;
      m.emissiveIntensity += d * 0.15;
      if (Math.abs(d) > 0.01) moving = true;
    }
    if (moving) invalidate();
  });

  const width = 2.6;
  const depth = 5.6;
  const height = 2.5;
  const rh = width * 0.75;

  return (
    <group
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(item, new THREE.Vector3(position[0], position[1], position[2]));
      }}
    >
      <GableHall
        position={[0, 0, 0]}
        width={width}
        depth={depth}
        height={height}
        windows={6}
        ridgeSpireCount={4}
        steep={0.75}
        coverFront
        bothSides
        registerWindow={registerWindow}
      />
      {/* tower connected to the front end of the hall */}
      <DecoTower
        position={[0, 0, depth / 2 + 0.1]}
        radius={0.55}
        height={height + 0.8}
        body={WHITE}
        roof={SLATE}
        windows={2}
        registerWindow={registerWindow}
      />

      <Html position={[0, height + rh + 1.4, depth / 2]} center zIndexRange={[20, 0]}>
        <button
          type="button"
          onClick={() =>
            onSelect(item, new THREE.Vector3(position[0], position[1], position[2]))
          }
          aria-label="Enter the Great Hall"
          className={`pointer-events-auto flex items-center gap-1.5 whitespace-nowrap rounded-pill border bg-[rgba(11,16,38,0.82)] px-3 py-1.5 text-xs font-semibold text-accent-text shadow-glow-sm backdrop-blur transition-all hover:border-accent hover:shadow-glow focus-visible:shadow-focus focus-visible:outline-none ${
            hovered
              ? "border-accent shadow-glow"
              : "border-[rgba(var(--accent-glow),0.5)]"
          }`}
        >
          <span aria-hidden>{item.glyph}</span>
          {item.label}
        </button>
      </Html>
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
      const d = clamp01(descendRef.current);
      const e = easeInOut(d);
      desiredPos.current.lerpVectors(WIDE_POS, DIVE_POS, e);
      desiredPos.current.x += pointer.current.x * 1.4 * (1 - d);
      desiredPos.current.y += pointer.current.y * 0.5 * (1 - d);
      desiredLook.current.lerpVectors(WIDE_LOOK, DIVE_LOOK, e);
      cam.position.lerp(desiredPos.current, 0.12);
      look.current.lerp(desiredLook.current, 0.12);
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
}: {
  item: NavItem;
  position: Vec3;
  height: number;
  radius: number;
  theme: CastleTheme;
  onSelect: (item: NavItem, pos: THREE.Vector3) => void;
}) {
  const [hovered, setHovered] = React.useState(false);
  useCursor(hovered);

  const roofRef = React.useRef<THREE.MeshStandardMaterial>(null);
  const winRefs = React.useRef<THREE.MeshStandardMaterial[]>([]);
  const coneH = radius * 2.7;

  React.useEffect(() => {
    invalidate();
  }, [hovered]);

  useFrame(() => {
    const roofTarget = 0; // cones stay dark gray — no hover glow
    const winTarget = hovered ? 2.3 : 1.2;
    let moving = false;
    if (roofRef.current) {
      const d = roofTarget - roofRef.current.emissiveIntensity;
      roofRef.current.emissiveIntensity += d * 0.15;
      if (Math.abs(d) > 0.01) moving = true;
    }
    for (const m of winRefs.current) {
      if (!m) continue;
      const d = winTarget - m.emissiveIntensity;
      m.emissiveIntensity += d * 0.15;
      if (Math.abs(d) > 0.01) moving = true;
    }
    if (moving) invalidate();
  });

  const select = (e?: ThreeEvent<MouseEvent>) => {
    e?.stopPropagation();
    onSelect(item, new THREE.Vector3(position[0], position[1], position[2]));
  };

  const winYs = [0.34, 0.5, 0.66, 0.82].map((f) => height * f);

  return (
    <group
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={select}
    >
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[radius * 0.86, radius, height, 16]} />
        <meshStandardMaterial
          color={WHITE}
          roughness={0.85}
          metalness={0.04}
          map={brickTexture()}
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

      {winYs.map((y, i) => (
        <mesh key={i} position={[0, y, radius * 0.92]}>
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
      ))}
      {[-0.3, -0.1, 0.1, 0.3].map((x, i) => (
        <Glow
          key={i}
          position={[x, height * 0.22, radius * 0.94]}
          size={[0.07, 0.07, 0.05]}
          intensity={1}
        />
      ))}

      <Html position={[0, height + coneH + 0.5, 0]} center zIndexRange={[20, 0]}>
        <button
          type="button"
          onClick={() => select()}
          aria-label={`Go to ${item.label}`}
          className={`pointer-events-auto flex items-center gap-1.5 whitespace-nowrap rounded-pill border bg-[rgba(11,16,38,0.82)] px-3 py-1.5 text-xs font-semibold text-accent-text shadow-glow-sm backdrop-blur transition-all hover:border-accent hover:shadow-glow focus-visible:shadow-focus focus-visible:outline-none ${
            hovered
              ? "border-accent shadow-glow"
              : "border-[rgba(var(--accent-glow),0.5)]"
          }`}
        >
          <span aria-hidden>{item.glyph}</span>
          {item.label}
        </button>
      </Html>
    </group>
  );
}
