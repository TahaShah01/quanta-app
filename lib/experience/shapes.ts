// Procedural point-cloud shapes for the homepage scene.
// Every shape is generated from live content counts, so adding a service,
// project or team member changes the geometry automatically.


import type { ShapeId } from "./store";

export interface ShapeCounts {
  services: number;
  projects: number;
  team: number;
}

export interface ShapeDef {
  /** N * 3 target positions */
  positions: Float32Array;
  /** Desktop offset in half-viewport units: [x, y] */
  offset: [number, number];
  scale: number;
  /** Idle rotation, radians per second */
  spin: number;
  /** Rotation about X, radians */
  tilt: number;
  opacity: number;
  /** Point-size multiplier */
  size: number;
}

type Rand = () => number;
type Vec3 = [number, number, number];

/** Small deterministic PRNG so shapes are identical on every load. */
export function seededRandom(seed: number): Rand {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(r: Rand): number {
  return Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r());
}

function randomDirection(r: Rand): Vec3 {
  const z = r() * 2 - 1;
  const phi = r() * Math.PI * 2;
  const rad = Math.sqrt(1 - z * z);
  return [Math.cos(phi) * rad, Math.sin(phi) * rad, z];
}

/** Evenly spread anchor points on a sphere (Fibonacci lattice). */
export function nexusAnchors(n: number, radius = 1.9): Vec3[] {
  const out: Vec3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const phi = i * golden;
    out.push([
      Math.cos(phi) * ring * radius,
      y * radius * 0.82,
      Math.sin(phi) * ring * radius,
    ]);
  }
  return out;
}

function write(out: Float32Array, i: number, x: number, y: number, z: number) {
  out[i * 3] = x;
  out[i * 3 + 1] = y;
  out[i * 3 + 2] = z;
}

function buildNexus(N: number, nodes: number): Float32Array {
  const r = seededRandom(11);
  const anchors = nexusAnchors(nodes);
  const out = new Float32Array(N * 3);

  for (let i = 0; i < N; i++) {
    const u = i / N;
    let x: number;
    let y: number;
    let z: number;

    if (u < 0.2) {
      // dense clouds around each node
      const a = anchors[i % nodes];
      const s = 0.07 + r() * 0.1;
      x = a[0] + gauss(r) * s;
      y = a[1] + gauss(r) * s;
      z = a[2] + gauss(r) * s;
    } else if (u < 0.3) {
      // core
      const s = 0.2;
      x = gauss(r) * s;
      y = gauss(r) * s;
      z = gauss(r) * s;
    } else if (u < 0.72) {
      // filaments: ring links between neighbours and spokes to the core
      const e = Math.floor(r() * nodes * 2);
      const t = r();
      let from: Vec3;
      let to: Vec3;
      if (e < nodes) {
        from = anchors[e];
        to = anchors[(e + 1) % nodes];
      } else {
        from = [0, 0, 0];
        to = anchors[e - nodes];
      }
      x = from[0] + (to[0] - from[0]) * t + gauss(r) * 0.014;
      y = from[1] + (to[1] - from[1]) * t + gauss(r) * 0.014;
      z = from[2] + (to[2] - from[2]) * t + gauss(r) * 0.014;
    } else {
      // dust shell
      const d = randomDirection(r);
      const rad = 2.3 + r() * 1.9;
      x = d[0] * rad;
      y = d[1] * rad;
      z = d[2] * rad;
    }
    write(out, i, x, y, z);
  }
  return out;
}

function buildDrift(N: number): Float32Array {
  const r = seededRandom(23);
  const out = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const d = randomDirection(r);
    const rad = Math.cbrt(r()) * 1.1;
    write(out, i, d[0] * rad * 4.6, d[1] * rad * 2.6, d[2] * rad * 3.2);
  }
  return out;
}

function buildStack(N: number, rowsIn: number): Float32Array {
  const r = seededRandom(37);
  const rows = Math.max(rowsIn, 2);
  // Rows tighten as services are added so the stack always fits the viewport.
  const gap = Math.min(0.62, 3.4 / rows);
  const out = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    if (i / N < 0.82) {
      const row = i % rows;
      const y = (row - (rows - 1) / 2) * gap + gauss(r) * 0.018;
      const rad = 1.25 + Math.sin(row * 1.3) * 0.22;
      const a = r() * Math.PI * 2;
      write(
        out,
        i,
        Math.cos(a) * rad + gauss(r) * 0.02,
        y,
        Math.sin(a) * rad + gauss(r) * 0.02
      );
    } else {
      const height = rows * gap + 0.8;
      write(out, i, gauss(r) * 0.03, (r() - 0.5) * height, gauss(r) * 0.03);
    }
  }
  return out;
}

function buildLattice(N: number): Float32Array {
  const r = seededRandom(41);
  const side = Math.ceil(Math.sqrt(N));
  const out = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const gx = i % side;
    const gz = Math.floor(i / side);
    const fx = gx / Math.max(side - 1, 1) - 0.5;
    const fz = gz / Math.max(side - 1, 1) - 0.5;
    const y =
      Math.sin(fx * 7) * 0.34 +
      Math.cos(fz * 6) * 0.3 +
      Math.sin((fx + fz) * 9) * 0.08 +
      gauss(r) * 0.01;
    write(out, i, fx * 7.2, y, fz * 5.2);
  }
  return out;
}

function buildOrbit(N: number, satellites: number): Float32Array {
  const r = seededRandom(53);
  const out = new Float32Array(N * 3);
  const ringR = 2.7;
  const sats = Math.max(satellites, 1);

  for (let i = 0; i < N; i++) {
    const u = i / N;
    if (u < 0.62) {
      // (2,3) torus knot
      const t = r() * Math.PI * 2;
      const R = 1.5;
      const tube = 0.5;
      const k = R + tube * Math.cos(3 * t);
      write(
        out,
        i,
        k * Math.cos(2 * t) + gauss(r) * 0.018,
        k * Math.sin(2 * t) + gauss(r) * 0.018,
        tube * Math.sin(3 * t) + gauss(r) * 0.018
      );
    } else if (u < 0.74) {
      const a = r() * Math.PI * 2;
      write(
        out,
        i,
        Math.cos(a) * ringR,
        Math.sin(a) * ringR,
        gauss(r) * 0.02
      );
    } else {
      // one cluster per project
      const k = i % sats;
      const a = (Math.PI * 2 * (k + 0.5)) / sats;
      write(
        out,
        i,
        Math.cos(a) * ringR + gauss(r) * 0.15,
        Math.sin(a) * ringR + gauss(r) * 0.15,
        gauss(r) * 0.15
      );
    }
  }
  return out;
}

function buildCrew(N: number, members: number): Float32Array {
  const r = seededRandom(67);
  const n = Math.max(members, 2);
  const ringR = 1.9;
  const out = new Float32Array(N * 3);

  const center = (k: number): Vec3 => {
    const a = (Math.PI * 2 * k) / n - Math.PI / 2;
    return [Math.cos(a) * ringR, Math.sin(a) * ringR, Math.sin(k * 2.1) * 0.35];
  };

  for (let i = 0; i < N; i++) {
    if (i / N < 0.82) {
      const c = center(i % n);
      const d = randomDirection(r);
      const rad = 0.34 + r() * 0.12;
      write(out, i, c[0] + d[0] * rad, c[1] + d[1] * rad, c[2] + d[2] * rad);
    } else {
      const k = Math.floor(r() * n);
      const from = center(k);
      const to = center((k + 1) % n);
      const t = r();
      write(
        out,
        i,
        from[0] + (to[0] - from[0]) * t + gauss(r) * 0.015,
        from[1] + (to[1] - from[1]) * t + gauss(r) * 0.015,
        from[2] + (to[2] - from[2]) * t + gauss(r) * 0.015
      );
    }
  }
  return out;
}

function buildSingularity(N: number): Float32Array {
  const r = seededRandom(79);
  const out = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const u = i / N;
    if (u < 0.66) {
      const d = randomDirection(r);
      const rad = 0.05 + 2.4 * Math.pow(r(), 2.6);
      write(out, i, d[0] * rad, d[1] * rad, d[2] * rad);
    } else if (u < 0.9) {
      const a = r() * Math.PI * 2;
      const rad = 1 + r() * 1.9;
      write(out, i, Math.cos(a) * rad, gauss(r) * 0.03, Math.sin(a) * rad);
    } else {
      const d = randomDirection(r);
      const rad = 3.2 + r() * 1.2;
      write(out, i, d[0] * rad, d[1] * rad, d[2] * rad);
    }
  }
  return out;
}

export function buildShapes(
  N: number,
  counts: ShapeCounts
): Record<ShapeId, ShapeDef> {
  const nodes = Math.max(counts.services, 3);
  const crewScale = Math.min(1.15, 4.6 / Math.max(counts.team, 2) + 0.35);

  return {
    nexus: {
      positions: buildNexus(N, nodes),
      offset: [0.42, 0],
      scale: 1.12,
      spin: 0.1,
      tilt: 0.12,
      opacity: 0.95,
      size: 1,
    },
    drift: {
      positions: buildDrift(N),
      offset: [0, 0],
      scale: 1.1,
      spin: 0.03,
      tilt: 0.1,
      opacity: 0.34,
      size: 0.8,
    },
    stack: {
      positions: buildStack(N, counts.services),
      offset: [0, 0],
      scale: 1,
      spin: 0.14,
      tilt: 0.28,
      opacity: 0.5,
      size: 0.9,
    },
    lattice: {
      positions: buildLattice(N),
      offset: [0, 0.1],
      scale: 1.05,
      spin: 0.025,
      tilt: 1.05,
      opacity: 0.55,
      size: 0.85,
    },
    orbit: {
      positions: buildOrbit(N, counts.projects),
      offset: [0, 0],
      scale: 1.1,
      spin: 0.16,
      tilt: 0.3,
      opacity: 0.55,
      size: 0.9,
    },
    crew: {
      positions: buildCrew(N, counts.team),
      offset: [0, 0],
      scale: crewScale,
      spin: 0.08,
      tilt: 0.2,
      opacity: 0.62,
      size: 0.95,
    },
    singularity: {
      positions: buildSingularity(N),
      offset: [0, 0],
      scale: 1.05,
      spin: 0.12,
      tilt: 0.38,
      opacity: 0.92,
      size: 1.1,
    },
  };
}
