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
   Palette — cool paper-white stone, indigo towers, slate roofs, faceted rock,
   warm candlelit windows, a pale moon. (Tower glow uses the live --accent.)
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
const WARM = "#ffcf6b";
const WATER = "#0b1734";

/* Tower placements (index-matched to nav items). [0] is the central keep. */
const LAYOUT: { position: Vec3; height: number; radius: number }[] = [
  { position: [0, 0, -0.5], height: 4.4, radius: 0.95 }, // Great Hall (home) — central keep
  { position: [-4.8, 0, 1.4], height: 3.9, radius: 0.85 }, // Projects — Great Astronomy Tower
  { position: [3.7, 0, 1.2], height: 3.0, radius: 0.72 }, // About — right-wing tower
  { position: [6.2, 0, 0.4], height: 2.6, radius: 0.6 }, // Resume — right end tower
  { position: [-2.1, 0, 2.7], height: 2.3, radius: 0.58 }, // Contact — front turret
];

// Camera poses: wide framing of the whole castle → "dive" toward the keep.
const WIDE_POS = new THREE.Vector3(0, 4.6, 17.5);
const WIDE_LOOK = new THREE.Vector3(0, 3.2, -1);
const DIVE_POS = new THREE.Vector3(0, 2.7, 4.8);
const DIVE_LOOK = new THREE.Vector3(0, 2.4, -0.8);

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/* ============================================================================
   Reusable detail pieces
   ============================================================================ */

/** Glowing window/door — emissive, bloom-friendly. */
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

/** Crenellation ring (merlons) around a tower rim. */
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

/** Decorative round tower: body + cone roof, optional crenellations / windows. */
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

/** Slender spire. */
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

/** Long hall: box body + gable roof + window row + ridge pinnacles. */
function GableHall({
  position,
  rotation = [0, 0, 0],
  width = 2.6,
  depth = 5,
  height = 2.2,
  body = WHITE,
  roof = SLATE,
  windows = 6,
  ridgeSpires = true,
}: {
  position: Vec3;
  rotation?: Vec3;
  width?: number;
  depth?: number;
  height?: number;
  body?: string;
  roof?: string;
  windows?: number;
  ridgeSpires?: boolean;
}) {
  const rh = width * 0.5;
  const hw = width / 2;
  const slope = Math.sqrt(hw * hw + rh * rh);
  const ang = Math.atan2(rh, hw);
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={body} roughness={0.85} />
      </mesh>
      {/* gable roof (two slanted planks) */}
      <mesh position={[-hw / 2, height + rh / 2, 0]} rotation={[0, 0, ang]}>
        <boxGeometry args={[slope, 0.14, depth + 0.12]} />
        <meshStandardMaterial color={roof} roughness={0.7} />
      </mesh>
      <mesh position={[hw / 2, height + rh / 2, 0]} rotation={[0, 0, -ang]}>
        <boxGeometry args={[slope, 0.14, depth + 0.12]} />
        <meshStandardMaterial color={roof} roughness={0.7} />
      </mesh>
      {/* windows along the +x long wall */}
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
      {/* ridge pinnacles */}
      {ridgeSpires &&
        Array.from({ length: Math.max(3, Math.round(depth / 1.2)) }).map((_, i, arr) => {
          const z = -depth / 2 + (depth / (arr.length - 1)) * i;
          return (
            <mesh key={i} position={[0, height + rh + 0.18, z]}>
              <coneGeometry args={[0.1, 0.5, 6]} />
              <meshStandardMaterial color={WHITE_DK} roughness={0.8} />
            </mesh>
          );
        })}
    </group>
  );
}

/** Arched glowing doorway (a panel + a half-round top). */
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

/** Faceted low-poly rock the castle stands on. */
function Cliff() {
  return (
    <group>
      <mesh position={[0, -5.4, -0.5]} scale={[1.9, 0.96, 1.35]}>
        <icosahedronGeometry args={[6, 1]} />
        <meshStandardMaterial color={ROCK} flatShading roughness={1} />
      </mesh>
      <mesh position={[-3.4, -5.9, -1]} scale={[1.2, 0.9, 1]}>
        <icosahedronGeometry args={[4, 1]} />
        <meshStandardMaterial color={ROCK_DK} flatShading roughness={1} />
      </mesh>
      <mesh position={[4.2, -5.7, -1]} scale={[1.3, 0.9, 1]}>
        <icosahedronGeometry args={[4.2, 1]} />
        <meshStandardMaterial color={ROCK_LT} flatShading roughness={1} />
      </mesh>
    </group>
  );
}

/** Pale full moon (bloom halo). */
function Moon() {
  return (
    <mesh position={[7, 9.2, -14]}>
      <sphereGeometry args={[1.9, 32, 32]} />
      <meshStandardMaterial
        color="#eef2ff"
        emissive="#d8e0ff"
        emissiveIntensity={1.45}
        toneMapped={false}
      />
    </mesh>
  );
}

/** Dark lake at the base. */
function Water() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.25, 6]}>
      <planeGeometry args={[90, 70]} />
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
      camera={{ position: [0, 4.6, 17.5], fov: 45 }}
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
        toPos: new THREE.Vector3(pos.x * 0.5, pos.y + 2.4, pos.z + 5.5),
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

  React.useEffect(() => {
    invalidate();
  }, []);

  return (
    <>
      <color attach="background" args={[theme.bg]} />
      <fog attach="fog" args={[theme.bgSunken, 20, 60]} />

      <ambientLight intensity={0.55} />
      {/* Moonlight from upper-right */}
      <directionalLight position={[7, 12, -4]} intensity={1.25} color="#dbe2ff" />
      <directionalLight position={[-8, 6, 8]} intensity={0.25} color="#8a93c0" />
      <pointLight
        position={[0, 5, 5]}
        intensity={16}
        distance={26}
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
      <Moon />
      <Water />
      <Cliff />

      <CameraRig flyRef={flyRef} descendRef={descendRef} onArrive={onNavigate} />
      <CastleBackdrop />

      {items.slice(0, LAYOUT.length).map((item, i) => (
        <Tower
          key={item.href}
          item={item}
          theme={theme}
          position={LAYOUT[i].position}
          height={LAYOUT[i].height}
          radius={LAYOUT[i].radius}
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
   Decorative castle (non-interactive) — the Hogwarts silhouette around the
   interactive nav towers. Numbers reference the structure spec.
   ============================================================================ */
function CastleBackdrop() {
  return (
    <group>
      {/* Ground footing under the keep cluster */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -0.5]}>
        <circleGeometry args={[9, 40]} />
        <meshStandardMaterial color={ROCK_LT} roughness={1} />
      </mesh>

      {/* #2 Lower attached turret beside the Astronomy tower */}
      <Spire
        position={[-5.85, 0, 1.9]}
        radius={0.34}
        height={2.6}
        body={WHITE}
        roof={SLATE}
      />

      {/* #3 The Great Hall — long gabled building behind the keep, left */}
      <GableHall
        position={[-2.9, 0, -2.4]}
        rotation={[0, 0.45, 0]}
        width={2.5}
        depth={5.4}
        height={2.3}
        body={WHITE}
        roof={SLATE}
        windows={6}
      />

      {/* #4 Transition hallway with an arched doorway, behind the keep */}
      <group position={[0.7, 0, -3.1]}>
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[2.4, 2, 2]} />
          <meshStandardMaterial color={WHITE_DK} roughness={0.85} />
        </mesh>
        <mesh position={[0, 2.05, 0]}>
          <boxGeometry args={[2.6, 0.18, 2.2]} />
          <meshStandardMaterial color={SLATE_DK} roughness={0.8} />
        </mesh>
        <ArchDoor position={[0, 0, 1.02]} width={0.7} height={1.2} />
        <Glow position={[-0.8, 1.1, 1.02]} size={[0.16, 0.4, 0.06]} />
        <Glow position={[0.8, 1.1, 1.02]} size={[0.16, 0.4, 0.06]} />
      </group>

      {/* #5 Foreground white corbelled tower where the bridge meets the cliff */}
      <DecoTower
        position={[2.1, 0, 0.7]}
        radius={0.62}
        height={2.6}
        body={WHITE}
        roof={SLATE}
        crenel
        windows={2}
      />

      {/* #6 Deep purple tower trio (tallest in the middle) */}
      <DecoTower
        position={[1.3, 0, -4.4]}
        radius={0.55}
        height={2.6}
        body={PURPLE}
        roof={SLATE_DK}
      />
      <DecoTower
        position={[2.4, 0, -4.7]}
        radius={0.6}
        height={3.4}
        body={PURPLE}
        roof={SLATE_DK}
      />
      <DecoTower
        position={[3.4, 0, -4.3]}
        radius={0.5}
        height={2.3}
        body={PURPLE_DK}
        roof={SLATE_DK}
      />

      {/* #7 Tall grand spire (right-center, set back) */}
      <DecoTower
        position={[2.0, 0, -3.5]}
        radius={0.5}
        height={5.4}
        body={PURPLE}
        roof={SLATE_DK}
        band
      />

      {/* #9 Far-right end block + corner turret */}
      <group position={[5.7, 0, -0.7]}>
        <mesh position={[0, 1.1, 0]}>
          <boxGeometry args={[3, 2.2, 2.4]} />
          <meshStandardMaterial color={WHITE} roughness={0.85} />
        </mesh>
        <mesh position={[0, 2.28, 0]}>
          <boxGeometry args={[3.2, 0.18, 2.6]} />
          <meshStandardMaterial color={SLATE_DK} roughness={0.8} />
        </mesh>
        {[-1.0, -0.5, 0, 0.5, 1.0].map((x) => (
          <Glow key={x} position={[x, 1.0, 1.22]} size={[0.18, 0.5, 0.06]} />
        ))}
        {/* tiny square corner tower with twin slits */}
        <mesh position={[1.7, 1.3, 0]}>
          <boxGeometry args={[0.9, 2.6, 0.9]} />
          <meshStandardMaterial color={WHITE_DK} roughness={0.85} />
        </mesh>
        <mesh position={[1.7, 3.0, 0]}>
          <coneGeometry args={[0.7, 0.9, 4]} />
          <meshStandardMaterial color={SLATE} roughness={0.7} />
        </mesh>
        <Glow position={[1.7, 1.5, 0.46]} size={[0.08, 0.4, 0.05]} />
        <Glow position={[1.55, 1.5, 0.46]} size={[0.08, 0.4, 0.05]} />
      </group>

      {/* #10 Boathouse at the waterline */}
      <group position={[-0.8, -1.0, 5]}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1.5, 1, 1.8]} />
          <meshStandardMaterial color={WHITE} roughness={0.85} />
        </mesh>
        {/* pitched roof */}
        <mesh position={[-0.4, 1.25, 0]} rotation={[0, 0, 0.7]}>
          <boxGeometry args={[1.1, 0.12, 1.9]} />
          <meshStandardMaterial color={SLATE} roughness={0.7} />
        </mesh>
        <mesh position={[0.4, 1.25, 0]} rotation={[0, 0, -0.7]}>
          <boxGeometry args={[1.1, 0.12, 1.9]} />
          <meshStandardMaterial color={SLATE} roughness={0.7} />
        </mesh>
        {/* little spire on the ridge */}
        <Spire
          position={[0, 1.5, 0.7]}
          radius={0.12}
          height={0.6}
          body={WHITE}
          roof={SLATE}
        />
        {/* glowing arched door onto the water */}
        <ArchDoor
          position={[0, 0, 0.92]}
          width={0.6}
          height={0.95}
          color={WARM}
          intensity={1.8}
        />
      </group>
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
      desiredPos.current.x += pointer.current.x * 1.6 * (1 - d);
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
   Interactive nav tower — crenellated white tower with glowing windows + label.
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

  // Four stacked windows up the shaft.
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
      {/* Tower body */}
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[radius * 0.86, radius, height, 16]} />
        <meshStandardMaterial color={WHITE} roughness={0.85} metalness={0.04} />
      </mesh>

      {/* Crenellation ring just under the roof */}
      <Crenellations
        radius={radius * 0.92}
        y={height + 0.04}
        count={Math.max(10, Math.round(radius * 18))}
        size={[radius * 0.22, 0.3, radius * 0.22]}
      />

      {/* Conical roof — glows with the live accent, brighter on hover */}
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
      {/* Narrow vertical slits near the roof peak */}
      {[-0.16, 0, 0.16].map((x, i) => (
        <Glow
          key={i}
          position={[x, height + coneH * 0.75, radius * 0.5]}
          size={[0.05, 0.22, 0.05]}
          color={WARM}
          intensity={1.2}
        />
      ))}

      {/* Stacked glowing windows facing the camera */}
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
      {/* Row of tiny dotted windows below */}
      {[-0.3, -0.1, 0.1, 0.3].map((x, i) => (
        <Glow
          key={i}
          position={[x, height * 0.22, radius * 0.94]}
          size={[0.07, 0.07, 0.05]}
          intensity={1}
        />
      ))}

      {/* DOM label chip — keyboard-focusable nav control */}
      <Html position={[0, height + coneH + 0.5, 0]} center zIndexRange={[20, 0]}>
        <button
          type="button"
          onClick={() => select()}
          aria-label={item.href === "/" ? "Enter the Great Hall" : `Go to ${item.label}`}
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
