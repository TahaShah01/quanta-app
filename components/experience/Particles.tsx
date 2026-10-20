"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  frame,
  getActiveOffsetX,
  getActiveShape,
  sinks,
} from "@/lib/experience/store";
import {
  buildShapes,
  nexusAnchors,
  seededRandom,
} from "@/lib/experience/shapes";

const VERTEX = /* glsl */ `
  uniform float uSize;
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aSeed;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    p += 0.035 * vec3(
      sin(uTime * 0.6 + aSeed * 40.0),
      cos(uTime * 0.5 + aSeed * 31.0),
      sin(uTime * 0.7 + aSeed * 17.0)
    );
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = max(-mv.z, 0.1);
    gl_PointSize = uSize * uPixelRatio * (0.6 + aSeed * 0.9) * (6.0 / depth);
    vAlpha = 0.35 + aSeed * 0.65;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(uColor, a * vAlpha * uOpacity);
  }
`;

function createParticleSystem(count: number, start: Float32Array) {
  const rand = seededRandom(1337);

  // Begin as an exploded drift cloud so the first thing visitors see is the
  // dust condensing into the constellation.
  const current = new Float32Array(count * 3);
  for (let i = 0; i < current.length; i++) current[i] = start[i] * 1.8;

  const seeds = new Float32Array(count);
  const speeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    seeds[i] = rand();
    speeds[i] = 1.2 + rand() * 2.6;
  }

  const geometry = new THREE.BufferGeometry();
  const position = new THREE.BufferAttribute(current, 3);
  position.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute("position", position);
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color("#ffffff") },
      uSize: { value: 3.4 },
      uPixelRatio: { value: 1 },
      uOpacity: { value: 0 },
      uTime: { value: 0 },
    },
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return { geometry, material, speeds, current };
}

interface ParticlesProps {
  count: number;
  services: number;
  projects: number;
  team: number;
  theme: "dark" | "light";
}

export function Particles({
  count,
  services,
  projects,
  team,
  theme,
}: ParticlesProps) {
  const groupRef = useRef<THREE.Group>(null);
  const themeRef = useRef(theme);
  const labelWeight = useRef(0);
  const elapsed = useRef(0);
  const pulse = useRef(0);
  const scratch = useMemo(() => new THREE.Vector3(), []);

  const shapes = useMemo(
    () => buildShapes(count, { services, projects, team }),
    [count, services, projects, team]
  );
  const anchors = useMemo(() => nexusAnchors(Math.max(services, 3)), [services]);
  const labelBuf = useMemo(() => new Float32Array(anchors.length * 3), [anchors]);

  const system = useMemo(
    () => createParticleSystem(count, shapes.drift.positions),
    [count, shapes]
  );
  const { geometry, material, speeds, current } = system;

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  // Follow the site theme: colour comes from the same CSS variable the page uses.
  useEffect(() => {
    themeRef.current = theme;
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue("--foreground")
      .trim();
    material.uniforms.uColor.value.set(raw || (theme === "light" ? "#0f172a" : "#f5f5f5"));
    material.blending =
      theme === "light" ? THREE.NormalBlending : THREE.AdditiveBlending;
    material.needsUpdate = true;
  }, [theme, material]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const dt = Math.min(delta, 0.05);
    const damp = THREE.MathUtils.damp;
    const cfg = shapes[getActiveShape()];
    const desktop = state.size.width >= 1024;

    // Konami easter egg: throw every particle outward once, then let them settle.
    if (frame.explode) {
      frame.explode = false;
      for (let i = 0; i < current.length; i++) {
        current[i] *= 2.4 + Math.sin(i * 12.9898) * 0.8;
      }
    }

    pulse.current = damp(pulse.current, frame.pulse, 5, dt);
    const p = pulse.current;

    // 1. Stream every particle toward its target, each at its own pace.
    const target = cfg.positions;
    for (let i = 0, j = 0; i < current.length; i += 3, j++) {
      const k = Math.min(1, dt * speeds[j]);
      current[i] += (target[i] - current[i]) * k;
      current[i + 1] += (target[i + 1] - current[i + 1]) * k;
      current[i + 2] += (target[i + 2] - current[i + 2]) * k;
    }
    geometry.attributes.position.needsUpdate = true;

    // 2. Ease the whole group toward this section's framing.
    const framingX = getActiveOffsetX() ?? cfg.offset[0];
    const offsetX = desktop ? framingX * state.viewport.width * 0.5 : 0;
    const offsetY = cfg.offset[1] * state.viewport.height * 0.5;
    // Hovering a card leans the whole scene a little toward it.
    const leanX = frame.pullX * state.viewport.width * 0.04 * p;
    const leanY = frame.pullY * state.viewport.height * 0.04 * p;
    group.position.x = damp(group.position.x, offsetX + leanX, 2.5, dt);
    group.position.y = damp(group.position.y, offsetY + leanY, 2.5, dt);
    const fit = cfg.scale * (desktop ? 1 : 0.8);
    group.scale.setScalar(damp(group.scale.x, fit * (1 + p * 0.05), 2.5, dt));

    frame.velocity = damp(frame.velocity, 0, 5, dt);
    group.rotation.y += dt * cfg.spin + frame.velocity * dt * 0.03;
    group.rotation.x = damp(
      group.rotation.x,
      cfg.tilt + frame.pointerY * 0.12,
      3,
      dt
    );

    state.camera.position.x = damp(state.camera.position.x, frame.pointerX * 0.35, 3, dt);
    state.camera.position.y = damp(state.camera.position.y, frame.pointerY * 0.2, 3, dt);
    state.camera.lookAt(0, 0, 0);

    // 3. Material: fade, size, theme-aware strength.
    elapsed.current += dt;
    const u = material.uniforms;
    u.uTime.value = elapsed.current;
    u.uPixelRatio.value = state.viewport.dpr;
    u.uSize.value = damp(u.uSize.value, 3.4 * cfg.size * (1 + p * 0.5), 3, dt);
    // Dialled back so the dust never fights the copy in front of it.
    const strength = (themeRef.current === "light" ? 0.8 : 0.8) * (desktop ? 1 : 0.55);
    u.uOpacity.value = damp(
      u.uOpacity.value,
      Math.min(1, cfg.opacity * strength * (1 + p * 0.35)),
      2.5,
      dt
    );

    // 4. Project node anchors to screen space for the HTML labels.
    const wantLabels = getActiveShape() === "nexus" && desktop ? 1 : 0;
    labelWeight.current = damp(labelWeight.current, wantLabels, 4, dt);
    if (sinks.labels) {
      group.updateMatrixWorld();
      for (let i = 0; i < anchors.length; i++) {
        scratch
          .set(anchors[i][0], anchors[i][1], anchors[i][2])
          .applyMatrix4(group.matrixWorld);
        const depth = THREE.MathUtils.clamp(0.5 + scratch.z / 4, 0.15, 1);
        scratch.project(state.camera);
        labelBuf[i * 3] = (scratch.x * 0.5 + 0.5) * state.size.width;
        labelBuf[i * 3 + 1] = (-scratch.y * 0.5 + 0.5) * state.size.height;
        labelBuf[i * 3 + 2] = depth;
      }
      sinks.labels(labelBuf, labelWeight.current);
    }
  });

  return (
    <group ref={groupRef}>
      <points geometry={geometry} material={material} frustumCulled={false} />
    </group>
  );
}
