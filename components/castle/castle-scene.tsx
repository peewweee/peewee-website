"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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

type Vec3 = [number, number, number];

/* ----------------------------------------------------------------------------
   Palette
   ---------------------------------------------------------------------------- */
const WHITE = "#eef1f8";
const WHITE_DK = "#ccd2e6";
const PURPLE = "#4a3f8e";
const PURPLE_DK = "#352b66";
const SLATE = "#5a6172";
const SLATE_DK = "#39404f";
const ROCK = "#474d60";
const ROCK_DK = "#313749";
const ROCK_LT = "#565d72";
const BRIDGE = "#b3b9cb";
const WARM = "#ffcf6b";
const WATER = "#0b1734";

/* ----------------------------------------------------------------------------
   Anchoring heights — every structure sits flush on a plateau top.
   Left plateau is taller; right plateau is lower & flatter.
   ---------------------------------------------------------------------------- */
const WATER_Y = -3.2;
const LEFT_TOP = 0.7;
const RIGHT_TOP = 0.2;

/* Interactive nav towers (index 1..4 of navItems). Index 0 (Great Hall) is a
   building, handled separately. Each tower sits on its plateau top. */
const TOWERS: { position: Vec3; height: number; radius: number }[] = [
  { position: [-4.0, LEFT_TOP, -0.3], height: 5.2, radius: 1.15 }, // Projects — Main Astronomy Tower (tallest, thickest)
  { position: [5.6, RIGHT_TOP, 0.4], height: 3.4, radius: 0.8 }, // About — Main Right Tower
  { position: [2.4, RIGHT_TOP, 0.7], height: 2.7, radius: 0.62 }, // Resume — Castellated Bridge Tower
  { position: [-6.9, LEFT_TOP, 1.7], height: 2.3, radius: 0.5 }, // Contact — Small Forward Turret
];

// Camera: low, three-quarter front-LEFT (left close & prominent, right recedes).
const WIDE_POS = new THREE.Vector3(-11, 2.6, 15.5);
const WIDE_LOOK = new THREE.Vector3(1, 4, -2);
const DIVE_POS = new THREE.Vector3(-6.5, 2.8, 6);
const DIVE_LOOK = new THREE.Vector3(-6, 2.6, 0.4);

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

/* ============================================================================
   Reusable detail pieces
   ============================================================================ */

function Glow({
  position,
  size = [0.16, 0.42, 0.06],
  color = WARM,
  intensity = 1.4,
  rotation,
}: {
  position: Vec3;
  size?: Vec3;
  color?: string;
  intensity?: number;
  rotation?: Vec3;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial
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
}: {
  position: Vec3;
  radius: number;
  height: number;
  body?: string;
  roof?: string;
  crenel?: boolean;
  windows?: number;
  band?: boolean;
}) {
  const coneH = radius * 2.6;
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[radius * 0.9, radius, height, 14]} />
        <meshStandardMaterial color={body} roughness={0.85} />
      </mesh>
      {band && (
        <mesh position={[0, height - 0.25, 0]}>
          <cylinderGeometry args={[radius * 0.96, radius * 0.96, 0.2, 14]} />
          <meshStandardMaterial color={roof} roughness={0.8} />
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
        <meshStandardMaterial color={roof} roughness={0.7} metalness={0.1} />
      </mesh>
      {Array.from({ length: windows }).map((_, i) => (
        <Glow key={i} position={[0, height * 0.32 + i * 0.5, radius * 0.92]} />
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
        <meshStandardMaterial color={body} roughness={0.85} />
      </mesh>
      <mesh position={[0, height + radius * 1.6, 0]}>
        <coneGeometry args={[radius * 1.2, radius * 3.2, 12]} />
        <meshStandardMaterial color={roof} roughness={0.7} />
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
}) {
  const rh = width * steep;
  const hw = width / 2;
  const slope = Math.sqrt(hw * hw + rh * rh);
  const ang = Math.atan2(rh, hw);
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={body} roughness={0.85} />
      </mesh>
      <mesh position={[-hw / 2, height + rh / 2, 0]} rotation={[0, 0, ang]}>
        <boxGeometry args={[slope, 0.14, depth + 0.12]} />
        <meshStandardMaterial color={roof} roughness={0.7} />
      </mesh>
      <mesh position={[hw / 2, height + rh / 2, 0]} rotation={[0, 0, -ang]}>
        <boxGeometry args={[slope, 0.14, depth + 0.12]} />
        <meshStandardMaterial color={roof} roughness={0.7} />
      </mesh>
      {Array.from({ length: windows }).map((_, i) => {
        const z = -depth / 2 + (depth / (windows + 1)) * (i + 1);
        return (
          <Glow
            key={i}
            position={[width / 2 + 0.03, height * 0.5, z]}
            size={[0.06, 0.5, 0.18]}
          />
        );
      })}
      {Array.from({ length: ridgeSpireCount }).map((_, i, arr) => {
        const z = -depth / 2 + (depth / (arr.length + 1)) * (i + 1);
        return (
          <mesh key={i} position={[0, height + rh + 0.22, z]}>
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
      <meshStandardMaterial color={color} flatShading roughness={1} />
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
      <meshStandardMaterial color={color} flatShading roughness={1} />
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
        <meshStandardMaterial color={WHITE_DK} roughness={0.85} />
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
   Scene root
   ============================================================================ */

export function CastleScene({
  items,
  descendRef,
  onEnterGreatHall,
  onReady,
}: {
  items: NavItem[];
  descendRef?: React.MutableRefObject<number>;
  onEnterGreatHall?: () => void;
  onReady?: (invalidate: () => void) => void;
}) {
  const router = useRouter();
  const [theme] = React.useState<CastleTheme>(() => readCastleTheme());
  const fallbackDescend = React.useRef(0);
  const dRef = descendRef ?? fallbackDescend;
  const enter = React.useCallback(() => {
    if (onEnterGreatHall) onEnterGreatHall();
    else router.push("/");
  }, [onEnterGreatHall, router]);

  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ position: [-11, 2.6, 15.5], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
      className="!absolute inset-0"
    >
      <SceneContents
        items={items}
        theme={theme}
        descendRef={dRef}
        onEnterGreatHall={enter}
        onReady={onReady}
        onNavigate={(href) => router.push(href)}
      />
    </Canvas>
  );
}

type FlyTarget = {
  fromPos: THREE.Vector3;
  fromLook: THREE.Vector3;
  toPos: THREE.Vector3;
  toLook: THREE.Vector3;
  href: string;
  duration: number;
  start: number | null;
  done: boolean;
} | null;

function SceneContents({
  items,
  theme,
  descendRef,
  onEnterGreatHall,
  onNavigate,
  onReady,
}: {
  items: NavItem[];
  theme: CastleTheme;
  descendRef: React.MutableRefObject<number>;
  onEnterGreatHall: () => void;
  onNavigate: (href: string) => void;
  onReady?: (invalidate: () => void) => void;
}) {
  const flyRef = React.useRef<FlyTarget>(null);
  const navigatedRef = React.useRef(false);
  const inv = useThree((s) => s.invalidate);

  React.useEffect(() => {
    onReady?.(inv);
  }, [inv, onReady]);

  const handleSelect = React.useCallback(
    (item: NavItem, pos: THREE.Vector3) => {
      if (navigatedRef.current) return;
      if (item.href === "/") {
        onEnterGreatHall();
        return;
      }
      navigatedRef.current = true;
      flyRef.current = {
        fromPos: new THREE.Vector3(),
        fromLook: new THREE.Vector3(),
        toPos: new THREE.Vector3(pos.x * 0.6, pos.y + 2.4, pos.z + 5.5),
        toLook: new THREE.Vector3(pos.x, pos.y + 1.3, pos.z),
        href: item.href,
        duration: 1.1,
        start: null,
        done: false,
      };
      invalidate();
    },
    [onEnterGreatHall],
  );

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

      <ambientLight intensity={0.55} />
      <directionalLight position={[8, 12, -2]} intensity={1.2} color="#dbe2ff" />
      <directionalLight position={[-10, 6, 8]} intensity={0.3} color="#8a93c0" />
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

      <CameraRig flyRef={flyRef} descendRef={descendRef} onArrive={onNavigate} />
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
          <meshStandardMaterial color={WHITE_DK} roughness={0.85} />
        </mesh>
        <mesh position={[0, 2.05, 0]}>
          <boxGeometry args={[2.6, 0.18, 2.4]} />
          <meshStandardMaterial color={SLATE_DK} roughness={0.8} />
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
        roof={PURPLE_DK}
      />
      <Spire
        position={[4.6, RIGHT_TOP, -2.6]}
        radius={0.32}
        height={3.2}
        body={PURPLE}
        roof={PURPLE_DK}
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
          <meshStandardMaterial color={WHITE_DK} roughness={0.85} />
        </mesh>
        <mesh position={[0, 2.4, 0]}>
          <coneGeometry args={[0.6, 0.8, 4]} />
          <meshStandardMaterial color={SLATE} roughness={0.7} />
        </mesh>
        <Glow position={[0, 1.2, 0.36]} size={[0.08, 0.4, 0.05]} />
      </group>

      {/* The boathouse — at the water's edge in front of the chasm */}
      <group position={[1.2, WATER_Y, 3.4]}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1.4, 1, 1.7]} />
          <meshStandardMaterial color={WHITE} roughness={0.85} />
        </mesh>
        <mesh position={[-0.38, 1.32, 0]} rotation={[0, 0, 0.82]}>
          <boxGeometry args={[1.25, 0.12, 1.8]} />
          <meshStandardMaterial color={SLATE} roughness={0.7} />
        </mesh>
        <mesh position={[0.38, 1.32, 0]} rotation={[0, 0, -0.82]}>
          <boxGeometry args={[1.25, 0.12, 1.8]} />
          <meshStandardMaterial color={SLATE} roughness={0.7} />
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
      />
      {/* tower connected to the front end of the hall */}
      <DecoTower
        position={[0, 0, depth / 2 + 0.1]}
        radius={0.55}
        height={height + 0.8}
        body={WHITE}
        roof={SLATE}
        windows={2}
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
  onArrive,
}: {
  flyRef: React.MutableRefObject<FlyTarget>;
  descendRef: React.MutableRefObject<number>;
  onArrive: (href: string) => void;
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
      if (fly.start === null) {
        fly.start = state.clock.elapsedTime;
        fly.fromPos.copy(cam.position);
        fly.fromLook.copy(look.current);
      }
      const t = clamp01((state.clock.elapsedTime - fly.start) / fly.duration);
      const e = easeInOut(t);
      cam.position.lerpVectors(fly.fromPos, fly.toPos, e);
      look.current.lerpVectors(fly.fromLook, fly.toLook, e);
      moving = true;
      if (t >= 1 && !fly.done) {
        fly.done = true;
        onArrive(fly.href);
      }
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
    const roofTarget = hovered ? 1.6 : 0.5;
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
        <meshStandardMaterial color={WHITE} roughness={0.85} metalness={0.04} />
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
          color={theme.accent}
          emissive={theme.accent}
          emissiveIntensity={0.5}
          roughness={0.45}
          metalness={0.35}
        />
      </mesh>
      {[-0.16, 0, 0.16].map((x, i) => (
        <Glow
          key={i}
          position={[x, height + coneH * 0.75, radius * 0.5]}
          size={[0.05, 0.22, 0.05]}
          intensity={1.2}
        />
      ))}

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
