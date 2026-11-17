"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import AlbumArt from "./AlbumArt";
import type { NowPlaying } from "./data";

const POLL_MS = 30_000;

// A coarse clock for "2h ago" labels. Null during SSR/hydration, so the static HTML
// never contains a time-dependent string.
const CLOCK_MS = 30_000;
const subscribeClock = (cb: () => void) => {
  const id = setInterval(cb, CLOCK_MS);
  return () => clearInterval(id);
};
const getClock = () => Math.floor(Date.now() / CLOCK_MS) * CLOCK_MS;
const getServerClock = () => null;

function isNowPlaying(value: unknown): value is NowPlaying {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.isPlaying === "boolean" && (typeof v.track === "string" || v.track === null);
}

function timeAgo(iso: string | null, now: number): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const s = Math.max(0, Math.round((now - then) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

function Equalizer({ playing }: { playing: boolean }) {
  return (
    <span aria-hidden="true" className={`eq ${playing ? "eq--on" : ""}`}>
      <span />
      <span />
      <span />
      <span />
      <style jsx>{`
        .eq {
          display: inline-flex;
          align-items: flex-end;
          gap: 2px;
          height: 12px;
        }
        .eq span {
          width: 3px;
          height: 40%;
          border-radius: 1px;
          background: #fff0be;
          transform-origin: bottom;
        }
        .eq span:nth-child(2) { height: 100%; }
        .eq span:nth-child(3) { height: 65%; }
        .eq span:nth-child(4) { height: 85%; }
        @media (prefers-reduced-motion: no-preference) {
          .eq--on span {
            animation: eq-bounce 1s ease-in-out infinite alternate;
          }
          .eq--on span:nth-child(2) { animation-delay: -0.4s; animation-duration: 0.8s; }
          .eq--on span:nth-child(3) { animation-delay: -0.2s; animation-duration: 1.1s; }
          .eq--on span:nth-child(4) { animation-delay: -0.6s; animation-duration: 0.9s; }
        }
        @keyframes eq-bounce {
          from { transform: scaleY(0.3); }
          to { transform: scaleY(1); }
        }
      `}</style>
    </span>
  );
}

export default function NowPlayingCard({
  initial,
  endpoint,
}: {
  initial: NowPlaying | null;
  endpoint: string;
}) {
  const [data, setData] = useState<NowPlaying | null>(initial);
  const now = useSyncExternalStore(subscribeClock, getClock, getServerClock);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!endpoint) return;
    let cancelled = false;

    const refresh = () =>
      fetch(endpoint, { headers: { Accept: "application/json" } })
        .then((res) => (res.ok ? res.json() : null))
        .then((body: unknown) => {
          if (!cancelled && isNowPlaying(body) && body.track) setData(body);
        })
        // Fail quietly: keep showing the build-time snapshot.
        .catch(() => {});

    const stop = () => {
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
    };
    const start = () => {
      stop();
      void refresh();
      timer.current = setInterval(refresh, POLL_MS);
    };
    const onVisibility = () => (document.visibilityState === "visible" ? start() : stop());

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [endpoint]);

  if (!data?.track) {
    return (
      <p className="font-neutraface text-lg text-[#e4dfff]/60">Nothing on the turntable right now.</p>
    );
  }

  const artists = data.artists.join(", ");
  const ago = now ? timeAgo(data.playedAt, now) : null;
  const status = data.isPlaying ? "Now playing" : ago ? `Last played · ${ago}` : "Last played";

  const body = (
    <>
      <Turntable art={data.albumArt} spinning={data.isPlaying} />
      <div className="min-w-0 flex-1 text-center sm:text-left">
        <p className="flex items-center justify-center sm:justify-start gap-2.5 font-neutraface uppercase tracking-widest text-xs text-[#FFF0BE]/80">
          <Equalizer playing={data.isPlaying} />
          <span>{status}</span>
        </p>
        <p className="mt-4 font-neutraface text-3xl md:text-5xl text-white leading-[1.05] tracking-tight line-clamp-2 text-balance">
          {data.track}
        </p>
        {artists && (
          <p className="mt-2 font-neutraface text-lg md:text-xl text-[#e4dfff]/70 truncate">{artists}</p>
        )}
        {data.url && (
          <p className="mt-5 inline-flex items-center gap-1.5 font-neutraface text-sm text-[#FFF0BE]/60 transition-colors group-hover:text-[#FFF0BE] group-focus-visible:text-[#FFF0BE]">
            Listen on Spotify
            <span aria-hidden="true" className="transition-transform motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5">
              ↗
            </span>
          </p>
        )}
      </div>
    </>
  );

  const cls = "group relative flex flex-col sm:flex-row items-center gap-8 sm:gap-12 lg:gap-16 rounded-3xl";
  return (
    <div className="relative">
      {/* Ambient glow: the album art, blurred way out, tints the band behind the record. */}
      {data.albumArt && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-0 flex items-center justify-start overflow-visible">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.albumArt}
            alt=""
            className="h-[140%] w-auto sm:w-[60%] max-w-none object-cover opacity-35 blur-[90px] saturate-150 mx-auto sm:mx-0"
          />
        </div>
      )}
      {data.url ? (
        <a
          href={data.url}
          target="_blank"
          rel="noopener"
          className={`${cls} focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-8 focus-visible:outline-[#FFF0BE]/40`}
          aria-label={`${status}: ${data.track}${artists ? ` by ${artists}` : ""}. Open on Spotify (new tab)`}
        >
          {body}
        </a>
      ) : (
        <div className={cls}>{body}</div>
      )}
    </div>
  );
}

/**
 * Album sleeve with a record sliding out of it. The record spins while something is
 * playing (only with prefers-reduced-motion: no-preference; see .vinyl-spin in globals.css).
 */
function Turntable({ art, spinning }: { art: string | null; spinning: boolean }) {
  return (
    <div aria-hidden="true" className="relative shrink-0 w-[232px] h-[160px] sm:w-[290px] sm:h-[200px]">
      <div
        className={`vinyl absolute top-0 left-[72px] sm:left-[90px] h-[160px] w-[160px] sm:h-[200px] sm:w-[200px] transition-transform duration-500 ease-out motion-safe:group-hover:translate-x-3 ${
          spinning ? "" : "motion-safe:group-hover:rotate-12"
        }`}
      >
        <div className={`vinyl-disc absolute inset-0 rounded-full ${spinning ? "vinyl-spin" : ""}`}>
          <div className="absolute inset-[31%] overflow-hidden rounded-full">
            <AlbumArt src={art} size={200} rounded="rounded-full" className="!w-full !h-full" />
          </div>
          <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#090C19]" />
        </div>
        <div className="vinyl-sheen absolute inset-0 rounded-full" />
      </div>
      <div className="absolute top-0 left-0 h-[160px] w-[160px] sm:h-[200px] sm:w-[200px] overflow-hidden rounded-lg shadow-[0_24px_60px_-12px_rgba(0,0,0,0.7)] ring-1 ring-white/10">
        <AlbumArt src={art} size={200} rounded="rounded-none" className="!w-full !h-full" />
      </div>
    </div>
  );
}
