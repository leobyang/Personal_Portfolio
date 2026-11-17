"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { buildSky, type SkyPostInput } from "@/lib/sky";

const HIT_RADIUS = 22; // px; links are 44×44 around each star
const GLOW_TIME_CONSTANT = 65; // ms; ≈95% of the way in ~200 ms
const MAX_DPR = 2;
const LABEL_GAP = 26;

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia(reducedMotionQuery);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getReducedMotion = () => window.matchMedia(reducedMotionQuery).matches;
const getReducedMotionServer = () => false;

function formatDate(date: string) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

type Rect = { top: number; left: number; width: number; height: number };

export default function StarrySky({ posts, children }: { posts: SkyPostInput[]; children?: ReactNode }) {
  const sky = useMemo(() => buildSky(posts), [posts]);
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, getReducedMotionServer);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [activeId, setActiveId] = useState<string | null>(null);
  // The label keeps showing the last active post while it fades out.
  const [labelId, setLabelId] = useState<string | null>(null);
  const [region, setRegion] = useState<Rect>({ top: 0, left: 0, width: 0, height: 0 });

  const activeRef = useRef<string | null>(null);
  const kickRef = useRef<() => void>(() => {});
  const lastPointerType = useRef<string>("mouse");

  const activate = (id: string | null) => {
    activeRef.current = id;
    setActiveId(id);
    if (id) setLabelId(id);
    kickRef.current();
  };

  // Canvas: sizing, visibility and the render loop.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const regionEl = regionRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!wrapper || !regionEl || !canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let rect: Rect = { top: 0, left: 0, width: 0, height: 0 };
    let inView = true;
    let frame = 0;
    let last = 0;
    const glow = new Float32Array(sky.stars.length);
    const groupGlow = new Float32Array(sky.constellations.length);

    const measure = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      width = wrapper.clientWidth;
      height = wrapper.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rect = {
        top: regionEl.offsetTop,
        left: regionEl.offsetLeft,
        width: regionEl.clientWidth,
        height: regionEl.clientHeight,
      };
      setRegion(rect);
    };

    const draw = (now: number) => {
      const t = now / 1000;
      ctx.clearRect(0, 0, width, height);

      // Background stars across the whole section.
      ctx.fillStyle = "#ffffff";
      for (const s of sky.background) {
        const twinkle = reducedMotion ? 1 : 0.7 + 0.3 * Math.sin(t * s.speed + s.phase);
        ctx.globalAlpha = s.alpha * twinkle;
        ctx.beginPath();
        ctx.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      const px = (x: number) => rect.left + x * rect.width;
      const py = (y: number) => rect.top + y * rect.height;

      // Constellation lines.
      ctx.lineWidth = 1;
      sky.constellations.forEach((c, gi) => {
        if (c.edges.length === 0) return;
        ctx.strokeStyle = `rgba(241, 226, 177, ${0.25 + 0.4 * groupGlow[gi]})`;
        ctx.beginPath();
        for (const [a, b] of c.edges) {
          ctx.moveTo(px(sky.stars[a].x), py(sky.stars[a].y));
          ctx.lineTo(px(sky.stars[b].x), py(sky.stars[b].y));
        }
        ctx.stroke();
      });

      // Post stars with a soft glow.
      sky.stars.forEach((s, i) => {
        const g = glow[i];
        const x = px(s.x);
        const y = py(s.y);
        const pulse = reducedMotion ? 1 : 0.88 + 0.12 * Math.sin(t * 1.4 + s.phase);
        const r = s.r * (1 + 0.6 * g);
        const halo = r * (4 + 3 * g);
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, halo);
        gradient.addColorStop(0, `rgba(255, 240, 190, ${(0.35 + 0.4 * g) * pulse})`);
        gradient.addColorStop(0.35, `rgba(241, 226, 177, ${(0.12 + 0.18 * g) * pulse})`);
        gradient.addColorStop(1, "rgba(241, 226, 177, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, halo, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255, 248, 225, ${0.85 + 0.15 * g})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    // Ease glow values towards their targets; returns true while still moving.
    const step = (dt: number) => {
      const active = activeRef.current;
      const activeGroup = active ? sky.stars.find((s) => s.post.id === active)?.group ?? -1 : -1;
      const k = reducedMotion ? 1 : 1 - Math.exp(-dt / GLOW_TIME_CONSTANT);
      let moving = false;
      sky.stars.forEach((s, i) => {
        const target = s.post.id === active ? 1 : 0;
        glow[i] += (target - glow[i]) * k;
        if (Math.abs(target - glow[i]) > 0.002) moving = true;
        else glow[i] = target;
      });
      sky.constellations.forEach((_, gi) => {
        const target = gi === activeGroup ? 1 : 0;
        groupGlow[gi] += (target - groupGlow[gi]) * k;
        if (Math.abs(target - groupGlow[gi]) > 0.002) moving = true;
        else groupGlow[gi] = target;
      });
      return moving;
    };

    const running = () => inView && document.visibilityState === "visible";

    const tick = (now: number) => {
      frame = 0;
      const dt = last ? Math.min(now - last, 100) : 16;
      last = now;
      const moving = step(dt);
      draw(now);
      // With reduced motion nothing twinkles, so only keep going while a glow eases.
      if (running() && (!reducedMotion || moving)) frame = requestAnimationFrame(tick);
    };

    const kick = () => {
      if (!frame && running()) {
        last = 0;
        frame = requestAnimationFrame(tick);
      }
    };
    const halt = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };
    kickRef.current = kick;

    const resizeObserver = new ResizeObserver(() => {
      measure();
      draw(performance.now());
      kick();
    });
    resizeObserver.observe(wrapper);
    resizeObserver.observe(regionEl);

    const intersection = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) kick();
      else halt();
    });
    intersection.observe(wrapper);

    const onVisibility = () => (document.visibilityState === "visible" ? kick() : halt());
    document.addEventListener("visibilitychange", onVisibility);

    measure();
    draw(performance.now());
    kick();

    return () => {
      halt();
      kickRef.current = () => {};
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [sky, reducedMotion]);

  const onPointerDown = (e: ReactPointerEvent) => {
    lastPointerType.current = e.pointerType;
  };

  const onClick = (e: ReactMouseEvent, id: string) => {
    // Touch: the first tap reveals the label, a second tap on the same star opens it.
    if (lastPointerType.current === "touch" && activeRef.current !== id) {
      e.preventDefault();
      activate(id);
    }
    lastPointerType.current = "mouse";
  };

  const activeGroup = activeId ? sky.stars.find((s) => s.post.id === activeId)?.group ?? -1 : -1;
  const labelStar = labelId ? sky.stars.find((s) => s.post.id === labelId) : undefined;

  let labelStyle: React.CSSProperties = {};
  let labelAlign: "left" | "right" | "center" = "left";
  if (labelStar && region.width > 0) {
    const sx = labelStar.x * region.width;
    const sy = labelStar.y * region.height;
    const labelWidth = Math.min(300, region.width * 0.62);
    const below = sy < region.height * 0.6;
    if (region.width - sx - LABEL_GAP >= labelWidth) {
      labelAlign = "left";
      labelStyle = { left: sx + LABEL_GAP, width: labelWidth };
    } else if (sx - LABEL_GAP >= labelWidth) {
      labelAlign = "right";
      labelStyle = { right: region.width - sx + LABEL_GAP, width: labelWidth };
    } else {
      labelAlign = "center";
      const left = Math.min(Math.max(sx - labelWidth / 2, 0), region.width - labelWidth);
      labelStyle = { left, width: labelWidth };
    }
    if (labelAlign === "center") {
      Object.assign(labelStyle, below ? { top: sy + LABEL_GAP } : { bottom: region.height - sy + LABEL_GAP });
    } else if (sy > region.height - 110) {
      Object.assign(labelStyle, { bottom: region.height - sy - 14 });
    } else {
      Object.assign(labelStyle, { top: sy - 14 });
    }
  }

  return (
    <div ref={wrapperRef} className="relative flex flex-col flex-1 py-24 md:py-32 px-8 md:px-24">
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block pointer-events-none" />

      <div className="relative z-10">{children}</div>

      <div
        ref={regionRef}
        className="relative z-10 flex-1 min-h-[420px] md:min-h-[480px] mt-6"
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) activate(null);
        }}
      >
        {/* Faint constellation names near each group's centroid */}
        {sky.constellations.map((c, gi) => (
          <span
            key={c.name}
            aria-hidden="true"
            className="absolute -translate-x-1/2 pointer-events-none select-none font-neutraface text-xs tracking-[0.2em] text-[#FFF0BE] transition-opacity duration-300 motion-reduce:transition-none"
            style={{
              left: `${c.cx * 100}%`,
              top: `calc(${c.cy * 100}% + 44px)`,
              opacity: gi === activeGroup ? 0.45 : 0,
            }}
          >
            {c.name}
          </span>
        ))}

        {/* Focusable, invisible hit targets over each star */}
        <ul className="contents">
          {sky.stars.map((s) => (
            <li key={s.post.id} className="contents">
              <Link
                href={`/blog/${s.post.id}`}
                aria-label={`${s.post.title}, ${formatDate(s.post.date)}`}
                className="absolute rounded-full outline-none focus-visible:ring-1 focus-visible:ring-[#FFF0BE]/40 [-webkit-tap-highlight-color:transparent]"
                style={{
                  left: `calc(${s.x * 100}% - ${HIT_RADIUS}px)`,
                  top: `calc(${s.y * 100}% - ${HIT_RADIUS}px)`,
                  width: HIT_RADIUS * 2,
                  height: HIT_RADIUS * 2,
                }}
                onPointerDown={onPointerDown}
                onPointerEnter={(e) => e.pointerType === "mouse" && activate(s.post.id)}
                onPointerLeave={(e) => {
                  if (e.pointerType === "mouse" && activeRef.current === s.post.id && document.activeElement !== e.currentTarget) {
                    activate(null);
                  }
                }}
                onFocus={() => {
                  // Touch taps focus the link before click; let onClick run the two-tap flow.
                  if (lastPointerType.current !== "touch") activate(s.post.id);
                }}
                onBlur={() => activeRef.current === s.post.id && activate(null)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") (e.currentTarget as HTMLElement).blur();
                }}
                onClick={(e) => onClick(e, s.post.id)}
              />
            </li>
          ))}
        </ul>

        {/* Label anchored to the star: no card, just softly shadowed text */}
        {labelStar && region.width > 0 && (
          <div
            aria-hidden="true"
            className={`absolute pointer-events-none font-neutraface transition-opacity duration-200 motion-reduce:transition-none ${
              labelAlign === "right" ? "text-right" : labelAlign === "center" ? "text-center" : "text-left"
            }`}
            style={{
              ...labelStyle,
              opacity: activeId === labelStar.post.id ? 1 : 0,
              textShadow: "0 1px 2px rgba(9,12,25,0.95), 0 0 14px rgba(9,12,25,0.9), 0 0 28px rgba(9,12,25,0.8)",
            }}
            onTransitionEnd={() => {
              if (activeRef.current !== labelStar.post.id) setLabelId(activeRef.current);
            }}
          >
            <p className="text-xs text-[#e4dfff]/70">{formatDate(labelStar.post.date)}</p>
            <p className="mt-1 text-lg leading-snug text-[#FFF0BE]">{labelStar.post.title}</p>
            {labelStar.post.excerpt && (
              <p className="mt-1.5 text-sm leading-relaxed text-[#F2EFFF]/85">{labelStar.post.excerpt}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
