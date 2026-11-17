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
      <p className="font-neutraface text-[#e4dfff]/60">Nothing on the turntable right now.</p>
    );
  }

  const artists = data.artists.join(", ");
  const ago = now ? timeAgo(data.playedAt, now) : null;
  const status = data.isPlaying ? "Now playing" : ago ? `Last played · ${ago}` : "Last played";

  const body = (
    <>
      <AlbumArt src={data.albumArt} size={128} rounded="rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-neutraface text-sm text-[#FFF0BE]/80">
          <Equalizer playing={data.isPlaying} />
          <span>{status}</span>
        </p>
        <p className="mt-3 font-neutraface text-2xl md:text-3xl text-white leading-tight line-clamp-2">
          {data.track}
        </p>
        {artists && (
          <p className="mt-1 font-neutraface text-base text-[#e4dfff]/70 truncate">{artists}</p>
        )}
      </div>
    </>
  );

  const cls = "flex items-center gap-5 sm:gap-7 rounded-xl -m-2 p-2";
  return data.url ? (
    <a
      href={data.url}
      target="_blank"
      rel="noopener"
      className={`${cls} transition-colors hover:bg-[#FFF0BE]/5 focus-visible:bg-[#FFF0BE]/5 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#FFF0BE]/40`}
      aria-label={`${status}: ${data.track}${artists ? ` by ${artists}` : ""}. Open on Spotify (new tab)`}
    >
      {body}
    </a>
  ) : (
    <div className={cls}>{body}</div>
  );
}
