"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
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

/**
 * CastleScene — the React Three Fiber navigation hub (Phase 2).
 *
 * An original low-poly night castle built procedurally (no external glTF, no IP
 * risk). Glowing towers are the nav: hover lifts the glow, click glides the
 * camera and routes. Colors are read from the design tokens so the scene stays
 * cohesive with the DOM and honors `data-house`. Rendered client-only (the hub
 * lazy-loads this with ssr:false on eligible devices); the always-present
 * accessible tower nav lives in the DOM beneath it.
 */
export function CastleScene({ items }: { items: NavItem[] }) {
  const router = useRouter();
  // Lazy init runs once on the client (this module is only loaded with ssr:false).
  const [theme] = React.useState<CastleTheme>(() => readCastleTheme());

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 4.5, 15], fov: 42 }}
      gl={{ antialias: true, alpha: false }}
      className="!absolute inset-0"
    >
      <SceneContents
        items={items}
        theme={theme}
        onNavigate={(href) => router.push(href)}
      />
    </Canvas>
  );
}

type FlyTarget = { pos: THREE.Vector3; look: THREE.Vector3 } | null;

function SceneContents({
  items,
  theme,
  onNavigate,
}: {
  items: NavItem[];
  theme: CastleTheme;
  onNavigate: (href: string) => void;
}) {
  const flyRef = React.useRef<FlyTarget>(null);
  const navigatedRef = React.useRef(false);

  const handleSelect = React.useCallback(
    (href: string, pos: THREE.Vector3) => {
      if (navigatedRef.current) return;
      navigatedRef.current = true;
      flyRef.current = {
        pos: new THREE.Vector3(pos.x * 0.6, pos.y + 3, pos.z + 6.5),
        look: new THREE.Vector3(pos.x, pos.y + 1.4, pos.z),
      };
      // Let the camera glide briefly, then route. The scene unmounts on navigate.
      window.setTimeout(() => onNavigate(href), 600);
    },
    [onNavigate],
  );

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

      <CameraRig flyRef={flyRef} />
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

/** Idle pointer-parallax; glides to a tower when a fly target is set. */
function CameraRig({ flyRef }: { flyRef: React.MutableRefObject<FlyTarget> }) {
  const look = React.useRef(new THREE.Vector3(0, 2, 0));
  const desiredPos = React.useRef(new THREE.Vector3());
  const desiredLook = React.useRef(new THREE.Vector3(0, 2, 0));

  useFrame((state) => {
    const cam = state.camera;
    if (flyRef.current) {
      cam.position.lerp(flyRef.current.pos, 0.06);
      look.current.lerp(flyRef.current.look, 0.06);
    } else {
      const px = state.pointer.x * 1.7;
      const py = 0.4 + state.pointer.y * 0.7;
      desiredPos.current.set(px, 4.5 + py, 15);
      cam.position.lerp(desiredPos.current, 0.04);
      look.current.lerp(desiredLook.current, 0.05);
    }
    cam.lookAt(look.current);
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
  onSelect: (href: string, pos: THREE.Vector3) => void;
}) {
  const [hovered, setHovered] = React.useState(false);
  useCursor(hovered);

  const roofRef = React.useRef<THREE.MeshStandardMaterial>(null);
  const winRef = React.useRef<THREE.MeshStandardMaterial>(null);

  // Ease the glow toward the hovered/idle target each frame.
  useFrame(() => {
    const roofTarget = hovered ? 1.5 : 0.45;
    const winTarget = hovered ? 2.4 : 1.1;
    if (roofRef.current) {
      roofRef.current.emissiveIntensity +=
        (roofTarget - roofRef.current.emissiveIntensity) * 0.15;
    }
    if (winRef.current) {
      winRef.current.emissiveIntensity +=
        (winTarget - winRef.current.emissiveIntensity) * 0.15;
    }
  });

  const select = (e?: ThreeEvent<MouseEvent>) => {
    e?.stopPropagation();
    onSelect(item.href, new THREE.Vector3(position[0], position[1], position[2]));
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
