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

/** Tower placements (index-matched to nav items). The first is the central keep. */
const LAYOUT: { position: Vec3; height: number; radius: number }[] = [
  { position: [0, 0, -1.2], height: 3.6, radius: 0.85 },
  { position: [-4.2, 0, 0.6], height: 2.7, radius: 0.7 },
  { position: [-2.1, 0, 1.9], height: 2.2, radius: 0.6 },
  { position: [2.1, 0, 1.9], height: 2.2, radius: 0.6 },
  { position: [4.2, 0, 0.6], height: 2.7, radius: 0.7 },
];

const STONE = "#2b3566";
const ROOF = "#1b2150";

// Camera poses. The "wide" framing shows the whole castle; the "dive" pose
// approaches the central keep (the Great Hall) — the scroll/descent target.
const WIDE_POS = new THREE.Vector3(0, 3.2, 13.5);
const WIDE_LOOK = new THREE.Vector3(0, 2.2, 0);
const DIVE_POS = new THREE.Vector3(0, 2.0, 3.2);
const DIVE_LOOK = new THREE.Vector3(0, 2.0, -1.4);

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/**
 * CastleScene — the React Three Fiber navigation hub.
 *
 * An original low-poly night castle built procedurally (no external glTF, no IP
 * risk). Glowing towers are the nav. Clicking a side tower glides the camera to
 * it and routes; clicking the central keep (Great Hall) scrolls down into the
 * hero. Scrolling drives the same camera "dive" via `descendRef` (0→1), so the
 * scroll and the Great-Hall click share one transition. Colors come from the
 * design tokens. Rendered client-only (lazy-loaded with ssr:false).
 */
export function CastleScene({
  items,
  descendRef,
  onEnterGreatHall,
  onReady,
}: {
  items: NavItem[];
  /** 0 (top, wide) → 1 (dived into the keep), driven by page scroll. */
  descendRef?: React.MutableRefObject<number>;
  /** Called when the Great Hall (central keep) tower is chosen. */
  onEnterGreatHall?: () => void;
  /** Hands the caller this canvas's `invalidate` (so a parent scroll handler can
   *  request a frame without importing R3F into the non-lazy bundle). */
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
      camera={{ position: [0, 3.2, 13.5], fov: 45 }}
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

  // Hand our invalidate to the parent (scroll handler drives the descent).
  React.useEffect(() => {
    onReady?.(inv);
  }, [inv, onReady]);

  const handleSelect = React.useCallback(
    (item: NavItem, pos: THREE.Vector3) => {
      if (navigatedRef.current) return;
      // The central keep is the Great Hall — descend into the hero, don't route.
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

  // First frame once mounted/sized (demand mode).
  React.useEffect(() => {
    invalidate();
  }, []);

  return (
    <>
      <color attach="background" args={[theme.bg]} />
      <fog attach="fog" args={[theme.bgSunken, 16, 48]} />

      <ambientLight intensity={0.35} />
      <directionalLight position={[6, 11, 6]} intensity={0.85} color="#cdd6ff" />
      <pointLight
        position={[0, 5, 4]}
        intensity={18}
        distance={22}
        color={theme.accentGlow}
      />

      <Stars
        radius={90}
        depth={45}
        count={1300}
        factor={3.2}
        saturation={0}
        fade
        speed={0.6}
      />

      <CameraRig flyRef={flyRef} descendRef={descendRef} onArrive={onNavigate} />
      <CastleBase theme={theme} />

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
          intensity={1.15}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

/**
 * Camera controller. Priority: an active route "fly" tween (eased, then routes);
 * otherwise interpolate wide→dive by `descendRef` with subtle pointer parallax
 * that fades out as you descend. Demand-driven: requests frames only while moving.
 */
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

/** Static castle mass: ground, central keep, curtain walls, glowing keep windows. */
function CastleBase({ theme }: { theme: CastleTheme }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[16, 56]} />
        <meshStandardMaterial color={theme.bgSunken} roughness={1} metalness={0} />
      </mesh>

      {/* Central keep */}
      <mesh position={[0, 1.4, -1.4]}>
        <boxGeometry args={[3.6, 2.8, 3]} />
        <meshStandardMaterial color={STONE} roughness={0.92} metalness={0.05} />
      </mesh>
      {/* Keep roofline rim */}
      <mesh position={[0, 2.95, -1.4]}>
        <boxGeometry args={[3.9, 0.3, 3.3]} />
        <meshStandardMaterial color={ROOF} roughness={0.9} />
      </mesh>

      {/* Curtain walls angling out to the side towers */}
      <mesh position={[-2.4, 0.8, 0.4]} rotation={[0, 0.55, 0]}>
        <boxGeometry args={[3, 1.6, 0.42]} />
        <meshStandardMaterial color={STONE} roughness={0.92} />
      </mesh>
      <mesh position={[2.4, 0.8, 0.4]} rotation={[0, -0.55, 0]}>
        <boxGeometry args={[3, 1.6, 0.42]} />
        <meshStandardMaterial color={STONE} roughness={0.92} />
      </mesh>

      {/* Glowing keep windows (picked up by bloom) */}
      {[-0.9, 0, 0.9].map((x) => (
        <mesh key={x} position={[x, 1.5, 0.06]}>
          <boxGeometry args={[0.22, 0.5, 0.05]} />
          <meshStandardMaterial
            color={theme.accentGlow}
            emissive={theme.accentGlow}
            emissiveIntensity={1.1}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

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
  const winRef = React.useRef<THREE.MeshStandardMaterial>(null);

  React.useEffect(() => {
    invalidate();
  }, [hovered]);

  useFrame(() => {
    const roofTarget = hovered ? 1.5 : 0.45;
    const winTarget = hovered ? 2.4 : 1.1;
    let moving = false;
    if (roofRef.current) {
      const d = roofTarget - roofRef.current.emissiveIntensity;
      roofRef.current.emissiveIntensity += d * 0.15;
      if (Math.abs(d) > 0.01) moving = true;
    }
    if (winRef.current) {
      const d = winTarget - winRef.current.emissiveIntensity;
      winRef.current.emissiveIntensity += d * 0.15;
      if (Math.abs(d) > 0.01) moving = true;
    }
    if (moving) invalidate();
  });

  const select = (e?: ThreeEvent<MouseEvent>) => {
    e?.stopPropagation();
    onSelect(item, new THREE.Vector3(position[0], position[1], position[2]));
  };

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
        <cylinderGeometry args={[radius * 0.82, radius, height, 9]} />
        <meshStandardMaterial color={STONE} roughness={0.88} metalness={0.08} />
      </mesh>

      {/* Conical roof */}
      <mesh position={[0, height + 0.55, 0]}>
        <coneGeometry args={[radius * 1.18, 1.2, 9]} />
        <meshStandardMaterial
          ref={roofRef}
          color={theme.accent}
          emissive={theme.accent}
          emissiveIntensity={0.45}
          roughness={0.45}
          metalness={0.35}
        />
      </mesh>

      {/* Glowing window facing the camera */}
      <mesh position={[0, height * 0.58, radius * 0.86]}>
        <boxGeometry args={[0.2, 0.46, 0.05]} />
        <meshStandardMaterial
          ref={winRef}
          color={theme.accentGlow}
          emissive={theme.accentGlow}
          emissiveIntensity={1.1}
          toneMapped={false}
        />
      </mesh>

      {/* DOM label chip (design-system owned) — also a keyboard-focusable control */}
      <Html position={[0, height + 1.5, 0]} center zIndexRange={[20, 0]}>
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
