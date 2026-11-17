/**
 * Deterministic star-chart layout for the blog sky.
 *
 * Everything is derived from seeds (a fixed seed for the background, hash(post.id)
 * for posts, hash(constellation) for group centres), so the sky looks the same on every
 * load. Positions are normalised 0–1 and only turned into pixels at draw time.
 *
 * Stability rules: constellations are placed oldest-first and posts within a
 * constellation oldest-first, and each placement only looks at earlier ones. Adding a
 * new post therefore never moves an existing star.
 */

export type SkyPostInput = {
  id: string;
  title: string;
  date: string;
  excerpt?: string;
  constellation: string;
};

export type BackgroundStar = { x: number; y: number; r: number; alpha: number; phase: number; speed: number };

export type PostStar = {
  post: SkyPostInput;
  x: number;
  y: number;
  r: number;
  phase: number;
  group: number;
};

export type Constellation = {
  name: string;
  /** Indices into SkyLayout.stars. */
  stars: number[];
  /** Minimum-spanning-tree edges as pairs of indices into SkyLayout.stars. */
  edges: [number, number][];
  /** Centroid of the member stars (for the faint name label). */
  cx: number;
  cy: number;
};

export type SkyLayout = {
  background: BackgroundStar[];
  stars: PostStar[];
  constellations: Constellation[];
};

/** FNV-1a 32-bit string hash. */
export function hash(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 PRNG: returns a function producing floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BACKGROUND_SEED = 0x1e0_2026;
const BACKGROUND_COUNT = 320;

const CENTRE_MIN_DISTANCE = 0.3;
const CENTRE_BOUNDS = { x0: 0.16, x1: 0.84, y0: 0.2, y1: 0.8 };
const STAR_BOUNDS = { x0: 0.04, x1: 0.96, y0: 0.06, y1: 0.94 };
const STAR_MIN_SEPARATION = 0.045;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(ax - bx, ay - by);
const time = (date: string) => {
  const t = new Date(date).getTime();
  return Number.isNaN(t) ? 0 : t;
};
const chronological = (a: SkyPostInput, b: SkyPostInput) =>
  time(a.date) - time(b.date) || a.id.localeCompare(b.id);

export function backgroundStars(count = BACKGROUND_COUNT): BackgroundStar[] {
  const rand = mulberry32(BACKGROUND_SEED);
  return Array.from({ length: count }, () => ({
    x: rand(),
    y: rand(),
    r: 0.3 + rand() * 1.1,
    alpha: 0.2 + rand() * 0.6,
    phase: rand() * Math.PI * 2,
    speed: 0.4 + rand() * 1.2,
  }));
}

function placeCentre(name: string, placed: { x: number; y: number }[]) {
  const rand = mulberry32(hash(`constellation:${name}`));
  let minDistance = CENTRE_MIN_DISTANCE;
  let candidate = { x: 0.5, y: 0.5 };
  // Re-roll deterministically until far enough from earlier centres; relax the
  // spacing gradually if the sky gets crowded.
  for (let attempt = 0; attempt < 400; attempt++) {
    candidate = {
      x: CENTRE_BOUNDS.x0 + rand() * (CENTRE_BOUNDS.x1 - CENTRE_BOUNDS.x0),
      y: CENTRE_BOUNDS.y0 + rand() * (CENTRE_BOUNDS.y1 - CENTRE_BOUNDS.y0),
    };
    if (placed.every((p) => dist(p.x, p.y, candidate.x, candidate.y) >= minDistance)) break;
    if (attempt % 40 === 39) minDistance *= 0.85;
  }
  return candidate;
}

function placeStar(id: string, centre: { x: number; y: number }, siblings: { x: number; y: number }[]) {
  const rand = mulberry32(hash(`post:${id}`));
  let x = centre.x;
  let y = centre.y;
  let minSeparation = STAR_MIN_SEPARATION;
  for (let attempt = 0; attempt < 200; attempt++) {
    const angle = rand() * Math.PI * 2;
    const radius = siblings.length === 0 ? rand() * 0.03 : 0.05 + rand() * 0.11;
    x = clamp(centre.x + Math.cos(angle) * radius, STAR_BOUNDS.x0, STAR_BOUNDS.x1);
    y = clamp(centre.y + Math.sin(angle) * radius * 1.15, STAR_BOUNDS.y0, STAR_BOUNDS.y1);
    if (siblings.every((s) => dist(s.x, s.y, x, y) >= minSeparation)) break;
    if (attempt % 30 === 29) minSeparation *= 0.85;
  }
  return { x, y, r: 2.4 + rand() * 1.4, phase: rand() * Math.PI * 2 };
}

/** Prim's algorithm over the given star indices; returns MST edges. */
function minimumSpanningTree(indices: number[], stars: PostStar[]): [number, number][] {
  if (indices.length < 2) return [];
  const inTree = new Set<number>([indices[0]]);
  const edges: [number, number][] = [];
  while (inTree.size < indices.length) {
    let best: [number, number] | null = null;
    let bestDistance = Infinity;
    for (const a of inTree) {
      for (const b of indices) {
        if (inTree.has(b)) continue;
        const d = dist(stars[a].x, stars[a].y, stars[b].x, stars[b].y);
        if (d < bestDistance) {
          bestDistance = d;
          best = [a, b];
        }
      }
    }
    if (!best) break;
    edges.push(best);
    inTree.add(best[1]);
  }
  return edges;
}

export function buildSky(posts: SkyPostInput[]): SkyLayout {
  const sorted = [...posts].sort(chronological);

  // Group by constellation, ordered by each group's oldest post.
  const groups = new Map<string, SkyPostInput[]>();
  for (const post of sorted) {
    const list = groups.get(post.constellation) ?? [];
    list.push(post);
    groups.set(post.constellation, list);
  }

  const stars: PostStar[] = [];
  const constellations: Constellation[] = [];
  const centres: { x: number; y: number }[] = [];

  for (const [name, members] of groups) {
    const centre = placeCentre(name, centres);
    centres.push(centre);
    const groupIndex = constellations.length;
    const indices: number[] = [];
    const placed: { x: number; y: number }[] = [];

    for (const post of members) {
      const star = placeStar(post.id, centre, placed);
      placed.push(star);
      indices.push(stars.length);
      stars.push({ post, group: groupIndex, ...star });
    }

    const cx = placed.reduce((s, p) => s + p.x, 0) / placed.length;
    const cy = placed.reduce((s, p) => s + p.y, 0) / placed.length;
    constellations.push({ name, stars: indices, edges: [], cx, cy });
  }

  for (const c of constellations) c.edges = minimumSpanningTree(c.stars, stars);

  return { background: backgroundStars(), stars, constellations };
}
