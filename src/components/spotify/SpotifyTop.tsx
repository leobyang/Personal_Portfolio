import type { ReactNode } from "react";
import AlbumArt from "./AlbumArt";
import { getSpotifyData, type SpotifyItem } from "./data";

type Kind = "tracks" | "artists" | "albums";

const TITLES: Record<Kind, string> = {
  tracks: "Top tracks",
  artists: "Top artists",
  albums: "Top albums",
};

function pick(kind: Kind): SpotifyItem[] {
  const data = getSpotifyData();
  if (kind === "tracks") return data.topTracks;
  if (kind === "artists") return data.topArtists;
  return data.topAlbums;
}

const linkFocus =
  "transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#FFF0BE]/40";

function MaybeLink({
  item,
  label,
  className,
  children,
}: {
  item: SpotifyItem;
  label: string;
  className: string;
  children: ReactNode;
}) {
  if (!item.url) return <div className={className}>{children}</div>;
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener"
      aria-label={`${label} on Spotify (opens in a new tab)`}
      className={`group ${className} ${linkFocus}`}
    >
      {children}
    </a>
  );
}

/**
 * Server component: one "chart" column from the build-time Spotify snapshot.
 * The #1 entry is featured large; #2–5 follow as compact rows.
 */
export default function SpotifyTop({ kind }: { kind: Kind }) {
  const items = pick(kind).slice(0, 5);
  const headingId = `spotify-top-${kind}`;
  const round = kind === "artists" ? "rounded-full" : "rounded-md";
  const subtitle = (item: SpotifyItem) => (kind === "artists" ? null : item.artists?.join(", ") || null);
  const label = (item: SpotifyItem, rank: number) => {
    const by = subtitle(item);
    return `#${rank}: ${item.name}${by ? ` by ${by}` : ""}`;
  };

  return (
    <div>
      <h4
        id={headingId}
        className="mb-6 font-neutraface uppercase tracking-widest text-xs text-[#FFF0BE]/60"
      >
        {TITLES[kind]}
      </h4>
      {items.length === 0 ? (
        <p className="font-neutraface text-sm text-[#e4dfff]/50">Nothing here yet.</p>
      ) : (
        <ol aria-labelledby={headingId}>
          {items.map((item, i) => {
            const rank = i + 1;
            const by = subtitle(item);

            if (i === 0) {
              return (
                <li key={`${item.name}-${i}`} className="mb-5">
                  <MaybeLink item={item} label={label(item, rank)} className="flex items-center gap-5 rounded-xl">
                    <span className="relative shrink-0">
                      <AlbumArt
                        src={item.image}
                        size={112}
                        rounded={kind === "artists" ? "rounded-full" : "rounded-lg"}
                        className="shadow-[0_18px_40px_-14px_rgba(0,0,0,0.8)] ring-1 ring-white/10 transition-transform duration-300 motion-safe:group-hover:-translate-y-1"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span aria-hidden="true" className="block font-neutraface uppercase tracking-widest text-[10px] text-[#FFF0BE]">
                        No. 1
                      </span>
                      <span className="mt-1.5 block font-neutraface text-xl text-white leading-tight line-clamp-2 group-hover:text-[#FFF0BE] transition-colors">
                        {item.name}
                      </span>
                      {by && (
                        <span className="mt-1 block truncate font-neutraface text-sm text-[#e4dfff]/60">{by}</span>
                      )}
                    </span>
                  </MaybeLink>
                </li>
              );
            }

            return (
              <li key={`${item.name}-${i}`} className="border-t border-[#FFF0BE]/[0.08]">
                <MaybeLink item={item} label={label(item, rank)} className="flex items-center gap-4 py-2.5 rounded-md">
                  <span
                    aria-hidden="true"
                    className="w-4 shrink-0 font-neutraface text-sm tabular-nums text-[#FFF0BE]/45"
                  >
                    {rank}
                  </span>
                  <AlbumArt src={item.image} size={40} rounded={round} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-neutraface text-[15px] text-white group-hover:text-[#FFF0BE] transition-colors">
                      {item.name}
                    </span>
                    {by && (
                      <span className="block truncate font-neutraface text-xs text-[#e4dfff]/55">{by}</span>
                    )}
                  </span>
                </MaybeLink>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
