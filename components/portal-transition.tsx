"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useFBO } from "@react-three/drei";
import * as THREE from "three";

import { registerCloseReveal } from "@/components/page-reveal";

/**
 * Window-enter transition — a feathered, shader-driven SDF iris reveal.
 *
 * A transparent fullscreen R3F overlay runs a real post-processing pass:
 *   1) a warm "portal energy" field (fbm noise, organic motion) is rendered to
 *      an FBO (render target);
 *   2) a fullscreen composite shader samples that FBO and opens an SDF iris in
 *      the middle — the circle boundary is warped by noise (not a hard circle),
 *      widely feathered, displaced with a gaussian falloff, with chromatic
 *      aberration, a soft edge blur and an edge glow.
 *
 * Outside the iris = the warm field (the outgoing scene). Inside the iris the
 * overlay is transparent, so the real next page shows through. No CSS masks, no
 * snapshot of the DOM. Forward is flagged in sessionStorage ("wiz:reveal"="in").
 */

const GROW_MS = 500; // slow + cinematic
const FEATHER = 1.5; // iris edge softness (fraction of half-height)
const BAND = 1; // boundary thickness for the displacement falloff
const WARP = 0.7; // how non-circular / organic the edge is
const DISP = 3; // UV displacement strength at the boundary

const useIso =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function tween(durMs: number, onFrame: (t: number) => void, onDone?: () => void) {
  let raf = 0;
  let start: number | null = null;
  const step = (ts: number) => {
    if (start === null) start = ts;
    const t = Math.min((ts - start) / durMs, 1);
    onFrame(t);
    if (t < 1) raf = requestAnimationFrame(step);
    else onDone?.();
  };
  raf = requestAnimationFrame(step);
  return () => {
    if (raf) cancelAnimationFrame(raf);
  };
}

/* --------------------------------------------------------------------------
   Shaders
   -------------------------------------------------------------------------- */

// Fullscreen vertex — output clip-space directly so a 2x2 plane fills the view
// regardless of camera.
const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// Ashima simplex noise (2D) + fbm — shared by both passes.
const NOISE = /* glsl */ `
  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
  float snoise(vec2 v){
    const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
    vec2 i=floor(v+dot(v,C.yy));
    vec2 x0=v-i+dot(i,C.xx);
    vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
    vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1;
    i=mod289(i);
    vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
    vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);
    m=m*m; m=m*m;
    vec3 x=2.0*fract(p*C.www)-1.0;
    vec3 h=abs(x)-0.5;
    vec3 ox=floor(x+0.5);
    vec3 a0=x-ox;
    m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
    vec3 g;
    g.x=a0.x*x0.x+h.x*x0.y;
    g.yz=a0.yz*x12.xz+h.yz*x12.yw;
    return 130.0*dot(m,g);
  }
  float fbm(vec2 p){
    float s=0.0, a=0.5;
    for(int i=0;i<5;i++){ s+=a*snoise(p); p*=2.0; a*=0.5; }
    return s*0.5+0.5;
  }
`;

// The warm portal field (rendered to the FBO).
const FIELD_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  ${NOISE}
  void main(){
    vec2 uv = vUv;
    vec2 q = uv * 2.0 - 1.0;
    float r = length(q);
    float n  = fbm(uv * 3.0 + vec2(uTime * 0.05, uTime * 0.03));
    float n2 = fbm(uv * 6.5 - vec2(uTime * 0.07, uTime * 0.02));
    vec3 base = mix(vec3(0.94, 0.74, 0.28), vec3(1.0, 0.92, 0.66), n);
    base += (n2 - 0.5) * 0.18;
    base += vec3(1.0, 0.85, 0.5) * (1.0 - smoothstep(0.0, 1.15, r)) * 0.28;
    gl_FragColor = vec4(base, 1.0);
  }
`;

// The composite / iris post-pass (drawn to screen, transparent inside the iris).
const COMP_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uField;
  uniform float uTime;
  uniform float uProgress;
  uniform float uAspect;
  uniform float uFeather;
  uniform float uBand;
  uniform float uWarp;
  uniform float uDisp;
  ${NOISE}
  void main(){
    vec2 uv = vUv;
    vec2 c = uv - 0.5;
    c.x *= uAspect;
    float d = length(c);
    vec2 dir = normalize(c + 1e-5);
    float t = uTime;

    // organic edge warp — perturb the distance field so the iris isn't a hard circle
    float warp = (fbm(uv * 5.0 + vec2(t * 0.12, -t * 0.09)) - 0.5) * uWarp;
    float dd = d + warp;

    // iris radius: starts fully covered, opens past the corners
    float radius = uProgress * 1.5 - 0.16;
    float sdf = dd - radius;

    // boundary falloff — 1 at the edge, 0 away (gaussian on the SDF)
    float edge = exp(-(sdf * sdf) / (2.0 * uBand * uBand));

    // UV displacement, strongest at the boundary (radial push + swirl)
    float nA = fbm(uv * 3.5 + vec2(t * 0.10, t * 0.08));
    float nB = fbm(uv * 7.0 + vec2(-t * 0.13, t * 0.05));
    vec2 swirl = vec2(nA - 0.5, nB - 0.5);
    vec2 disp = (dir * (nA - 0.5) * uDisp + swirl * (uDisp * 0.6)) * edge;
    vec2 fuv = uv + disp;

    // cinematic edge blur (5-tap, radius scaled by the boundary band)
    float bl = edge * 0.012;
    vec3 col = vec3(0.0);
    col += texture2D(uField, fuv).rgb * 0.36;
    col += texture2D(uField, fuv + vec2(bl, 0.0)).rgb * 0.16;
    col += texture2D(uField, fuv - vec2(bl, 0.0)).rgb * 0.16;
    col += texture2D(uField, fuv + vec2(0.0, bl)).rgb * 0.16;
    col += texture2D(uField, fuv - vec2(0.0, bl)).rgb * 0.16;

    // chromatic aberration along the radial direction at the boundary
    float ca = edge * 0.010;
    col.r = mix(col.r, texture2D(uField, fuv + dir * ca).r, edge);
    col.b = mix(col.b, texture2D(uField, fuv - dir * ca).b, edge);

    // edge glow
    col += vec3(1.0, 0.86, 0.52) * edge * 0.45;

    // feathered iris alpha — opaque warm field outside, transparent inside (the
    // page/castle shows). Direction (open vs close) is driven by uProgress.
    float mask = smoothstep(radius - uFeather, radius + uFeather, dd);
    gl_FragColor = vec4(col, mask);
  }
`;

/* --------------------------------------------------------------------------
   The pass
   -------------------------------------------------------------------------- */

function IrisPass({
  progressRef,
}: {
  progressRef: React.MutableRefObject<number>;
}) {
  const { gl, size } = useThree();
  const fbo = useFBO();

  const fieldMat = React.useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FIELD_FRAG,
        uniforms: { uTime: { value: 0 } },
        depthTest: false,
        depthWrite: false,
      }),
    [],
  );

  const compMat = React.useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: COMP_FRAG,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uField: { value: null as THREE.Texture | null },
          uTime: { value: 0 },
          uProgress: { value: 0 },
          uAspect: { value: 1 },
          uFeather: { value: FEATHER },
          uBand: { value: BAND },
          uWarp: { value: WARP },
          uDisp: { value: DISP },
        },
      }),
    [],
  );

  const fieldScene = React.useMemo(() => {
    const s = new THREE.Scene();
    s.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), fieldMat));
    return s;
  }, [fieldMat]);
  const fieldCam = React.useMemo(() => new THREE.Camera(), []);

  React.useEffect(() => {
    return () => {
      fieldMat.dispose();
      compMat.dispose();
    };
  }, [fieldMat, compMat]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    fieldMat.uniforms.uTime.value = t;
    compMat.uniforms.uTime.value = t;
    compMat.uniforms.uProgress.value = progressRef.current;
    compMat.uniforms.uAspect.value = size.width / Math.max(size.height, 1);
    compMat.uniforms.uField.value = fbo.texture;

    // render the warm field into the render target, then let R3F draw the
    // composite quad to the screen.
    gl.setRenderTarget(fbo);
    gl.render(fieldScene, fieldCam);
    gl.setRenderTarget(null);
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <primitive object={compMat} attach="material" />
    </mesh>
  );
}

/* --------------------------------------------------------------------------
   Error boundary — a failed WebGL context must never crash the page.
   -------------------------------------------------------------------------- */

class GLBoundary extends React.Component<
  { onFail: () => void; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFail();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/* --------------------------------------------------------------------------
   Controller
   -------------------------------------------------------------------------- */

export function PortalTransition() {
  const pathname = usePathname();
  const [mode, setMode] = React.useState<"in" | "close" | null>(null);
  const modeRef = React.useRef<"in" | "close" | null>(null);
  const progressRef = React.useRef(0);
  const cancelRef = React.useRef<() => void>(() => {});

  const setBoth = React.useCallback((m: "in" | "close" | null) => {
    modeRef.current = m;
    setMode(m);
  }, []);

  // Arrival: OPEN the iris (warm field → page/castle). Flagged "in" by both
  // directions — entering a window, and the back trip once its close finishes.
  useIso(() => {
    let flag: string | null = null;
    try {
      flag = sessionStorage.getItem("wiz:reveal");
      if (flag) sessionStorage.removeItem("wiz:reveal");
    } catch {
      /* ignore */
    }
    if (flag !== "in") return;
    if (prefersReducedMotion()) return; // instant for reduced-motion

    cancelRef.current();
    progressRef.current = 0;
    setBoth("in");
    const cancel = tween(
      GROW_MS,
      (t) => {
        progressRef.current = easeInOut(t);
      },
      () => {
        if (modeRef.current === "in") setBoth(null);
      },
    );
    cancelRef.current = cancel;
    // Only tear down if WE still own the overlay — never clobber a close in flight.
    return () => {
      cancel();
      if (modeRef.current === "in") {
        progressRef.current = 0;
        setBoth(null);
      }
    };
  }, [pathname, setBoth]);

  // Departure: the back trip plays the CLOSE on the page being left (the hole
  // shrinks, yellow fills in) BEFORE navigating — so it runs imperatively here,
  // and useLeaveReveal calls it. When it finishes it navigates; the overlay stays
  // full-yellow and the arrival "in" effect then opens it onto the castle.
  React.useEffect(() => {
    registerCloseReveal((onDone) => {
      if (prefersReducedMotion()) {
        onDone();
        return;
      }
      cancelRef.current();
      progressRef.current = 1; // start fully open (the page is visible)
      setBoth("close");
      const cancel = tween(
        90,
        (t) => {
          progressRef.current = 1 - easeInOut(t); // shrink the hole shut
        },
        () => onDone(),
      );
      cancelRef.current = cancel;
    });
    return () => registerCloseReveal(null);
  }, [setBoth]);

  if (!mode) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[130]" aria-hidden>
      <GLBoundary onFail={() => setBoth(null)}>
        <Canvas
          className="absolute inset-0"
          // Perf only (effect + timing unchanged): cap DPR and drop MSAA on this
          // fullscreen shader overlay. The iris is a soft, feathered, blurred field
          // with chromatic aberration, so a lower internal resolution and no
          // antialias are imperceptible — but far cheaper on weak GPUs / high-DPI
          // screens, which keeps the enter transition smooth.
          dpr={[1, 1.5]}
          frameloop="always"
          gl={{ alpha: true, premultipliedAlpha: false, antialias: false }}
          onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        >
          <IrisPass progressRef={progressRef} />
        </Canvas>
      </GLBoundary>
    </div>
  );
}
