"use client";

import { useEffect, useRef } from "react";
import { registerStarOverlay, starSelector } from "./starStore";

const EASE = "cubic-bezier(0.65, 0, 0.35, 1)";
const SKY = "#090C19";

const at = (x: number, y: number, scale: number, rotate = 0) =>
  `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotate}deg)`;

const nextFrame = () => new Promise<number>((r) => requestAnimationFrame(r));

/** Wait until the post's star exists and has stopped moving (layout + hash scroll settled). */
async function findStar(postId: string, timeoutMs: number) {
  const start = performance.now();
  let last = "";
  let stable = 0;
  while (performance.now() - start < timeoutMs) {
    await nextFrame();
    const el = document.querySelector<HTMLElement>(starSelector(postId));
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0) continue;
    const key = `${Math.round(r.left)},${Math.round(r.top)}`;
    stable = key === last ? stable + 1 : 0;
    last = key;
    if (stable >= 4) return el;
  }
  return null;
}

/**
 * Full-screen overlay (mounted once in the root layout) that carries a star between
 * the homepage sky and a post. Only used when motion is allowed; callers check.
 */
export default function StarTransition() {
  const rootRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const starRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current!;
    const veil = veilRef.current!;
    const star = starRef.current!;
    let safety = 0;

    const centre = () => [window.innerWidth / 2, window.innerHeight / 2] as const;
    const block = (on: boolean) => (root.style.pointerEvents = on ? "auto" : "none");

    const reveal = (delay = 0, duration = 450) => {
      window.clearTimeout(safety);
      const a = veil.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration,
        delay,
        easing: "ease-out",
        fill: "forwards",
      });
      a.finished.then(() => block(false)).catch(() => {});
    };

    return registerStarOverlay({
      async open(x, y) {
        block(true);
        const [cx, cy] = centre();
        const travel = star.animate(
          [
            { transform: at(x, y, 0.15, -30), opacity: 0 },
            { transform: at(x, y, 1.1, 0), opacity: 1, offset: 0.3 },
            { transform: at(cx, cy, 0.9, 12), opacity: 1 },
          ],
          { duration: 680, easing: EASE, fill: "forwards" },
        );
        const dim = veil.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 480,
          delay: 140,
          easing: "ease-in-out",
          fill: "forwards",
        });
        await Promise.all([travel.finished, dim.finished]).catch(() => {});
        // If the post never mounts (offline, error), don't leave the page covered.
        safety = window.setTimeout(() => {
          star.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: "forwards" });
          reveal();
        }, 8000);
      },

      arrivePost() {
        const [cx, cy] = centre();
        // The star blooms into the panel's gold ring (.panel-open), then the veil lifts.
        star.animate(
          [
            { transform: at(cx, cy, 0.9, 12), opacity: 1 },
            { transform: at(cx, cy, 1.6, 30), opacity: 0 },
          ],
          { duration: 320, easing: "ease-out", fill: "forwards" },
        );
        reveal(0, 380);
      },

      async close(postId) {
        block(true);
        const [cx, cy] = centre();
        // Timed against .panel-close (0.55s): the star flares as the orb vanishes.
        const flare = star.animate(
          [
            { transform: at(cx, cy, 0.2, -30), opacity: 0 },
            { transform: at(cx, cy, 1.15, 0), opacity: 1, offset: 0.45 },
            { transform: at(cx, cy, 0.9, 12), opacity: 1 },
          ],
          { duration: 520, delay: 380, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" },
        );
        const dim = veil.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 380,
          delay: 480,
          easing: "ease-in",
          fill: "forwards",
        });
        await Promise.all([flare.finished, dim.finished]).catch(() => {});

        // The caller navigates now; keep the star twinkling at centre until the sky is laid out.
        void (async () => {
          const target = await findStar(postId, 6000);
          if (!target) {
            star.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: "forwards" });
            reveal();
            return;
          }
          // Make sure the destination star is on screen (the sky can be taller than the viewport).
          let r = target.getBoundingClientRect();
          if (r.top < 90 || r.bottom > window.innerHeight - 40) {
            window.scrollBy({ top: r.top + r.height / 2 - window.innerHeight * 0.55, behavior: "instant" });
            await nextFrame();
            r = target.getBoundingClientRect();
          }
          const tx = r.left + r.width / 2;
          const ty = r.top + r.height / 2;
          const home = star.animate(
            [
              { transform: at(cx, cy, 0.9, 12), opacity: 1 },
              { transform: at(tx, ty, 0.32, 40), opacity: 1, offset: 0.82 },
              { transform: at(tx, ty, 0.08, 45), opacity: 0 },
            ],
            { duration: 820, easing: EASE, fill: "forwards" },
          );
          reveal(120, 600);
          await home.finished.catch(() => {});
        })();
      },
    });
  }, []);

  return (
    <div ref={rootRef} aria-hidden="true" className="fixed inset-0 z-[150] pointer-events-none">
      <div ref={veilRef} className="absolute inset-0 opacity-0" style={{ background: SKY }} />
      <div ref={starRef} className="star-flare absolute left-0 top-0 opacity-0" />
    </div>
  );
}
