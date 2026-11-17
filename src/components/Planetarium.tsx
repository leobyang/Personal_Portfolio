"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

// WebGL only runs in the browser; render nothing (just the dark background) on the server.
const DomeScene = dynamic(() => import("./planetarium/DomeScene"), { ssr: false });

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia(reducedMotionQuery);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function subscribeVisibility(cb: () => void) {
  document.addEventListener("visibilitychange", cb);
  return () => document.removeEventListener("visibilitychange", cb);
}

/**
 * The planetarium dome behind blog posts. Mounted from app/blog/layout.tsx so it
 * persists while moving between posts.
 */
export default function Planetarium() {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(reducedMotionQuery).matches,
    () => false,
  );
  const hidden = useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === "hidden",
    () => false,
  );

  return (
    <div className="fixed inset-0 bg-[#090C19]" aria-hidden="true">
      <DomeScene animate={!reducedMotion} paused={hidden} />
    </div>
  );
}
