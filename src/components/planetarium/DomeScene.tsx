"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mulberry32 } from "@/lib/sky";
import { onDomeNudge } from "./domeStore";
import { glowTexture, nebulaTexture, shaftTexture } from "./textures";

const SKY_RADIUS = 80;
const STAR_COUNT = 2600;
const SPIN_SPEED = 0.006; // rad/s: one revolution every ~17 minutes
const NUDGE = THREE.MathUtils.degToRad(10);
const PARALLAX_MAX = THREE.MathUtils.degToRad(2);
const LOOK_UP = 0.22; // rad
const POLE_TILT = new THREE.Euler(0.55, 0, 0.32);

/* ---------- Stars on the inner dome ---------- */

const starVertex = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uTwinkle;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vColor = color;
    vAlpha = 1.0 - uTwinkle * 0.35 * (0.5 + 0.5 * sin(uTime * (0.6 + aPhase) + aPhase * 6.2831));
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio;
  }
`;

const starFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float core = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor, pow(core, 1.5) * vAlpha);
  }
`;

function DomeStars({ animate }: { animate: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  const { geometry, material } = useMemo(() => {
    const rand = mulberry32(0xd0_3e);
    const positions = new Float32Array(STAR_COUNT * 3);
    const colors = new Float32Array(STAR_COUNT * 3);
    const sizes = new Float32Array(STAR_COUNT);
    const phases = new Float32Array(STAR_COUNT);
    const warm = new THREE.Color("#ffe9c4");
    const cool = new THREE.Color("#c9d4ff");
    const white = new THREE.Color("#ffffff");
    for (let i = 0; i < STAR_COUNT; i++) {
      // Uniform direction on a sphere.
      const u = rand() * 2 - 1;
      const theta = rand() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      positions.set([s * Math.cos(theta) * SKY_RADIUS, u * SKY_RADIUS, s * Math.sin(theta) * SKY_RADIUS], i * 3);
      const brightness = Math.pow(rand(), 3);
      const tint = rand();
      const c = (tint < 0.15 ? warm : tint < 0.35 ? cool : white).clone().multiplyScalar(0.6 + brightness * 0.4);
      colors.set([c.r, c.g, c.b], i * 3);
      sizes[i] = 1.6 + brightness * 3.6;
      phases[i] = rand();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    const material = new THREE.ShaderMaterial({
      vertexShader: starVertex,
      fragmentShader: starFragment,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: 1 },
        uTwinkle: { value: 1 },
      },
    });
    return { geometry, material };
  }, []);

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  useFrame(({ clock, gl }) => {
    const points = pointsRef.current;
    if (!points) return;
    const { uniforms } = points.material as THREE.ShaderMaterial;
    uniforms.uPixelRatio.value = gl.getPixelRatio();
    uniforms.uTwinkle.value = animate ? 1 : 0;
    uniforms.uTime.value = clock.elapsedTime;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

/* ---------- Nebulae (inside the rotating sky) ---------- */

function Nebulae() {
  const nebulae = useMemo(
    () => [
      { tex: nebulaTexture(11, [118, 86, 220], [70, 160, 200]), pos: [-34, 30, -52], scale: 62, opacity: 0.2 },
      { tex: nebulaTexture(23, [52, 160, 175], [110, 90, 210]), pos: [44, 16, -46], scale: 50, opacity: 0.14 },
      { tex: nebulaTexture(37, [140, 100, 230], [60, 140, 190]), pos: [8, 58, 30], scale: 70, opacity: 0.16 },
    ],
    [],
  );
  useEffect(() => () => nebulae.forEach((n) => n.tex.dispose()), [nebulae]);
  return (
    <>
      {nebulae.map((n, i) => (
        <sprite key={i} position={n.pos as [number, number, number]} scale={[n.scale, n.scale, 1]}>
          <spriteMaterial
            map={n.tex}
            transparent
            opacity={n.opacity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      ))}
    </>
  );
}

/* ---------- Projector glow and light shafts (fixed to the room) ---------- */

function Projector() {
  const glow = useMemo(() => glowTexture([255, 196, 140]), []);
  const shaft = useMemo(() => shaftTexture(), []);
  // Planes anchored at their bottom edge so they fan out from the projector.
  const shafts = useMemo(
    () =>
      [-0.42, -0.16, 0.12, 0.38].map((angle, i) => ({
        angle,
        geometry: new THREE.PlaneGeometry(5 + i, 70).translate(0, 35, 0),
      })),
    [],
  );
  useEffect(() => () => {
    glow.dispose();
    shaft.dispose();
    shafts.forEach((s) => s.geometry.dispose());
  }, [glow, shaft, shafts]);

  return (
    <group position={[0, -15, -42]}>
      <sprite scale={[46, 22, 1]}>
        <spriteMaterial map={glow} transparent opacity={0.32} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      {shafts.map(({ angle, geometry }, i) => (
        <mesh key={i} rotation={[0, 0, angle]} geometry={geometry}>
          <meshBasicMaterial
            map={shaft}
            transparent
            opacity={0.035}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- Dome shell: dark floor, blue–violet haze at the horizon ---------- */

const shellVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const shellFragment = /* glsl */ `
  varying vec3 vDir;
  void main() {
    float y = vDir.y;
    vec3 floorCol = vec3(0.012, 0.016, 0.04);
    vec3 haze = vec3(0.13, 0.11, 0.32);
    vec3 zenith = vec3(0.035, 0.047, 0.1);
    vec3 col = mix(floorCol, haze, smoothstep(-0.35, 0.02, y));
    col = mix(col, zenith, smoothstep(0.02, 0.55, y));
    gl_FragColor = vec4(col, 1.0);
  }
`;

function DomeShell() {
  return (
    <mesh>
      <sphereGeometry args={[95, 48, 32]} />
      <shaderMaterial vertexShader={shellVertex} fragmentShader={shellFragment} side={THREE.BackSide} depthWrite={false} />
    </mesh>
  );
}

/* ---------- Shooting star (at most every ~20 s) ---------- */

function ShootingStar({ animate }: { animate: boolean }) {
  const line = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
    // RGBA vertex colours: bright head, transparent tail.
    geometry.setAttribute("color", new THREE.BufferAttribute(new Float32Array([1, 0.97, 0.88, 1, 1, 0.97, 0.88, 0]), 4));
    const material = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    return new THREE.Line(geometry, material);
  }, []);
  const lineRef = useRef<THREE.Line>(null);
  // next < 0 means "not scheduled yet"; the first one is scheduled on the first frame.
  const state = useRef({ next: -1, start: -1, from: new THREE.Vector3(), dir: new THREE.Vector3() });

  useEffect(() => () => {
    line.geometry.dispose();
    (line.material as THREE.Material).dispose();
  }, [line]);

  useFrame(({ clock }) => {
    const mesh = lineRef.current;
    if (!mesh) return;
    const material = mesh.material as THREE.LineBasicMaterial;
    if (!animate) {
      material.opacity = 0;
      return;
    }
    const t = clock.elapsedTime;
    const s = state.current;
    if (s.next < 0) s.next = t + 8 + Math.random() * 12;
    if (s.start < 0 && t >= s.next) {
      s.start = t;
      const azimuth = (Math.random() - 0.5) * 1.4;
      const elevation = 0.35 + Math.random() * 0.35;
      s.from.set(Math.sin(azimuth) * 60, Math.sin(elevation) * 60, -Math.cos(azimuth) * 60);
      s.dir.set(Math.random() < 0.5 ? -1 : 1, -0.35 - Math.random() * 0.25, 0).normalize();
    }
    if (s.start < 0) return;
    const p = (t - s.start) / 0.9;
    if (p >= 1) {
      s.start = -1;
      s.next = t + 20 + Math.random() * 25;
      material.opacity = 0;
      return;
    }
    const head = s.from.clone().addScaledVector(s.dir, p * 26);
    const tail = head.clone().addScaledVector(s.dir, -6 * Math.min(1, p * 3));
    const pos = mesh.geometry.attributes.position as THREE.BufferAttribute;
    pos.setXYZ(0, head.x, head.y, head.z);
    pos.setXYZ(1, tail.x, tail.y, tail.z);
    pos.needsUpdate = true;
    material.opacity = Math.sin(p * Math.PI) * 0.9;
  });

  return <primitive ref={lineRef} object={line} />;
}

/* ---------- Sky rotation, nudges and parallax ---------- */

function Rig({ animate, children }: { animate: boolean; children: React.ReactNode }) {
  const spin = useRef<THREE.Group>(null);
  const nudge = useRef({ current: 0, target: 0 });
  const parallax = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  useEffect(() => {
    if (!animate) return;
    const offNudge = onDomeNudge((dir) => {
      nudge.current.target += dir * NUDGE;
    });
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      parallax.current.tx = (e.clientX / window.innerWidth) * 2 - 1;
      parallax.current.ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      parallax.current.tx = THREE.MathUtils.clamp(e.gamma / 30, -1, 1);
      parallax.current.ty = THREE.MathUtils.clamp((e.beta - 45) / 30, -1, 1);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("deviceorientation", onTilt, { passive: true });
    return () => {
      offNudge();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("deviceorientation", onTilt);
    };
  }, [animate]);

  useFrame(({ camera }, delta) => {
    camera.rotation.order = "YXZ";
    if (!spin.current || !animate) {
      camera.rotation.set(LOOK_UP, 0, 0);
      return;
    }
    const dt = Math.min(delta, 0.1);
    const n = nudge.current;
    const step = (n.target - n.current) * (1 - Math.exp(-dt / 0.22));
    n.current += step;
    spin.current.rotation.y += SPIN_SPEED * dt + step;

    const p = parallax.current;
    const k = 1 - Math.exp(-dt / 0.6);
    p.x += (p.tx - p.x) * k;
    p.y += (p.ty - p.y) * k;
    camera.rotation.set(LOOK_UP - p.y * PARALLAX_MAX, -p.x * PARALLAX_MAX, 0);
  });

  return (
    <group rotation={POLE_TILT}>
      <group ref={spin} rotation={[0, 0.8, 0]}>
        {children}
      </group>
    </group>
  );
}

export default function DomeScene({ animate, paused }: { animate: boolean; paused: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={paused ? "never" : animate ? "always" : "demand"}
      camera={{ position: [0, 0, 0], fov: 65, near: 0.1, far: 200 }}
      gl={{ antialias: false, alpha: false, powerPreference: "low-power" }}
      aria-hidden="true"
    >
      <color attach="background" args={["#090C19"]} />
      <DomeShell />
      <Rig animate={animate}>
        <Nebulae />
        <DomeStars animate={animate} />
      </Rig>
      <Projector />
      <ShootingStar animate={animate} />
    </Canvas>
  );
}
