"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import type { AdjacentPost, BlogPost } from "@/lib/blog";
import { nudgeDome, peekEnterDirection, setEnterDirection, type Direction } from "./domeStore";

type Phase = "idle" | "leave-left" | "leave-right" | "closing";

const SWIPE_MIN_DX = 60;
const SWIPE_RATIO = 1.5;

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function formatDate(date: string) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function isEditable(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  return el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName);
}

/** True if the pointer started inside something that scrolls horizontally (e.g. a code block). */
function startsInHorizontalScroller(target: EventTarget | null, boundary: HTMLElement) {
  let el = target instanceof Element ? target : null;
  while (el && el !== boundary) {
    if (el instanceof HTMLElement && el.scrollWidth > el.clientWidth + 1) {
      const overflowX = getComputedStyle(el).overflowX;
      if (overflowX === "auto" || overflowX === "scroll") return true;
    }
    el = el.parentElement;
  }
  return false;
}

const isPlainClick = (e: MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {dir === "left" ? <path d="m15 5-7 7 7 7" /> : <path d="m9 5 7 7-7 7" />}
    </svg>
  );
}

export default function PostPanel({
  post,
  prev,
  next,
}: {
  post: BlogPost;
  prev: AdjacentPost;
  next: AdjacentPost;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  // Read (don't consume) so StrictMode's double render sees the same value; cleared in an effect.
  const [enterFrom] = useState(() => peekEnterDirection());
  const panelRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const busy = useRef(false);
  const swipe = useRef<{ x: number; y: number; id: number } | null>(null);

  useEffect(() => {
    setEnterDirection(0);
    if (enterFrom !== 0) headingRef.current?.focus({ preventScroll: true });
  }, [enterFrom]);

  useEffect(() => {
    if (prev) router.prefetch(`/blog/${prev.id}`);
    if (next) router.prefetch(`/blog/${next.id}`);
  }, [prev, next, router]);

  const go = (dir: Direction) => {
    const target = dir === 1 ? next : prev;
    if (!target || busy.current) return;
    busy.current = true;
    const reduced = prefersReducedMotion();
    // "Next" slides the panel out to the left and the new one in from the right.
    setPhase(dir === 1 ? "leave-left" : "leave-right");
    if (!reduced) nudgeDome(dir);
    setEnterDirection(dir);
    window.setTimeout(() => router.replace(`/blog/${target.id}`, { scroll: false }), reduced ? 160 : 300);
  };

  const close = () => {
    if (busy.current) return;
    busy.current = true;
    setPhase("closing");
    window.setTimeout(() => {
      // Jump straight to the sky instead of smooth-scrolling down the whole homepage.
      document.documentElement.style.scrollBehavior = "auto";
      router.push("/#blog");
      window.setTimeout(() => {
        document.documentElement.style.scrollBehavior = "";
      }, 500);
    }, prefersReducedMotion() ? 120 : 420);
  };

  // Keep the latest handlers for the window listener without re-subscribing.
  const handlers = useRef({ go, close });
  useEffect(() => {
    handlers.current = { go, close };
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.key === "Escape") {
        e.preventDefault();
        handlers.current.close();
        return;
      }
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (isEditable(e.target) || isEditable(document.activeElement)) return;
      if ((window.getSelection()?.toString() ?? "").length > 0) return;
      e.preventDefault();
      handlers.current.go(e.key === "ArrowRight" ? 1 : -1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" || !e.isPrimary) return;
    if (startsInHorizontalScroller(e.target, e.currentTarget)) return;
    swipe.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start || start.id !== e.pointerId) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > SWIPE_MIN_DX && Math.abs(dx) > SWIPE_RATIO * Math.abs(dy)) {
      go(dx < 0 ? 1 : -1);
    }
  };

  const navClick = (dir: Direction) => (e: MouseEvent) => {
    if (!isPlainClick(e)) return;
    e.preventDefault();
    go(dir);
  };

  const animation =
    phase === "leave-left"
      ? "panel-out-left"
      : phase === "leave-right"
        ? "panel-out-right"
        : phase === "closing"
          ? "panel-close"
          : enterFrom === 1
            ? "panel-in-right"
            : enterFrom === -1
              ? "panel-in-left"
              : "panel-in-rise";

  const edgeButton =
    "hidden md:grid absolute top-1/2 -translate-y-1/2 place-items-center w-12 h-12 rounded-full border border-[#FFF0BE]/15 bg-[#090C19]/70 backdrop-blur-md text-[#FFF0BE]/80 hover:text-[#FFF0BE] hover:border-[#FFF0BE]/40 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#FFF0BE]/60 transition-colors";

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center md:p-8 pointer-events-none">
      <div ref={panelRef} className={`relative pointer-events-auto w-full h-[100dvh] md:h-[85vh] md:max-w-[52rem] ${animation}`}>
        {prev && (
          <Link
            href={`/blog/${prev.id}`}
            replace
            scroll={false}
            onClick={navClick(-1)}
            className={`${edgeButton} -left-20`}
            aria-label={`Previous post: ${prev.title}`}
          >
            <Chevron dir="left" />
          </Link>
        )}
        {next && (
          <Link
            href={`/blog/${next.id}`}
            replace
            scroll={false}
            onClick={navClick(1)}
            className={`${edgeButton} -right-20`}
            aria-label={`Next post: ${next.title}`}
          >
            <Chevron dir="right" />
          </Link>
        )}

        <article
          className="h-full flex flex-col overflow-hidden bg-[rgba(9,12,25,0.86)] backdrop-blur-md md:rounded-[24px] md:border md:border-[#FFF0BE]/10 md:shadow-[0_30px_80px_rgba(4,3,20,0.6)]"
          aria-labelledby="post-title"
        >
          <div
            className="post-scroll flex-1 overflow-y-auto overflow-x-hidden overscroll-contain touch-pan-y"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => (swipe.current = null)}
          >
            {/* Sticky top bar with the close button */}
            <div className="sticky top-0 z-10 flex justify-end px-4 md:px-5 pt-3 pb-2 bg-[rgba(9,12,25,0.92)] md:bg-transparent backdrop-blur-md md:backdrop-blur-none">
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="grid place-items-center w-11 h-11 rounded-full border border-[#FFF0BE]/20 bg-[#090C19]/60 text-[#FFF0BE] hover:bg-[#FFF0BE] hover:text-[#090C19] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#FFF0BE]/70 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <div className="mx-auto w-full max-w-[68ch] px-4 md:px-10 pb-16">
              <header className="pt-2 md:pt-4 pb-10">
                <p className="font-neutraface text-sm text-[#FFF0BE]/75">
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                  <span aria-hidden="true"> · </span>
                  <span>{post.readingMinutes} min read</span>
                </p>
                <h1
                  id="post-title"
                  ref={headingRef}
                  tabIndex={-1}
                  className="mt-4 font-custom text-4xl md:text-[3.25rem] leading-[1.08] text-white [text-wrap:balance] outline-none"
                >
                  {post.title}
                </h1>
                <p className="mt-5 inline-flex items-center gap-2 font-neutraface text-xs text-[#FFF0BE]/70">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" />
                  </svg>
                  {post.constellation} constellation
                </p>
              </header>

              <div className="post-prose" dangerouslySetInnerHTML={{ __html: post.contentHtml || "" }} />

              <footer className="mt-16 pt-10 border-t border-[#FFF0BE]/10">
                <nav aria-label="More posts" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {prev ? (
                    <Link
                      href={`/blog/${prev.id}`}
                      replace
                      scroll={false}
                      onClick={navClick(-1)}
                      className="group rounded-2xl border border-[#FFF0BE]/10 p-4 hover:border-[#FFF0BE]/30 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#FFF0BE]/60 transition-colors"
                    >
                      <span className="block font-neutraface text-xs text-[#FFF0BE]/60">← Previous</span>
                      <span className="mt-1 block font-neutraface text-base text-white group-hover:text-[#FFF0BE]">{prev.title}</span>
                    </Link>
                  ) : (
                    <span className="hidden sm:block" />
                  )}
                  {next && (
                    <Link
                      href={`/blog/${next.id}`}
                      replace
                      scroll={false}
                      onClick={navClick(1)}
                      className="group rounded-2xl border border-[#FFF0BE]/10 p-4 sm:text-right hover:border-[#FFF0BE]/30 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#FFF0BE]/60 transition-colors"
                    >
                      <span className="block font-neutraface text-xs text-[#FFF0BE]/60">Next →</span>
                      <span className="mt-1 block font-neutraface text-base text-white group-hover:text-[#FFF0BE]">{next.title}</span>
                    </Link>
                  )}
                </nav>
                <p className="mt-10 text-center">
                  <Link
                    href="/#blog"
                    onClick={(e) => {
                      if (!isPlainClick(e)) return;
                      e.preventDefault();
                      close();
                    }}
                    className="font-neutraface text-sm text-[#FFF0BE] underline underline-offset-4 decoration-[#FFF0BE]/40 hover:decoration-[#FFF0BE]"
                  >
                    Back to the sky
                  </Link>
                </p>
              </footer>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
