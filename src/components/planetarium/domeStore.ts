/**
 * Tiny client-side channel between the post panel and the persistent dome
 * (the dome lives in app/blog/layout.tsx, so it survives post-to-post navigation).
 */
export type Direction = -1 | 1;

const listeners = new Set<(dir: Direction) => void>();
let enterDirection: Direction | 0 = 0;

/** Rotate the projected sky ~10° in the direction the panel is leaving. */
export function nudgeDome(dir: Direction) {
  listeners.forEach((listener) => listener(dir));
}

export function onDomeNudge(listener: (dir: Direction) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Remember which way the next panel should slide in from. */
export function setEnterDirection(dir: Direction | 0) {
  enterDirection = dir;
}

export function peekEnterDirection(): Direction | 0 {
  return enterDirection;
}
