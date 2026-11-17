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

/** Server component: numbered top-5 list from the build-time Spotify snapshot. */
export default function SpotifyTop({ kind, showTitle = true }: { kind: Kind; showTitle?: boolean }) {
  const items = pick(kind).slice(0, 5);
  const headingId = `spotify-top-${kind}`;

  return (
    <div>
      {showTitle && (
        <h3
          id={headingId}
          className="font-neutraface text-sm text-[#FFF0BE]/70 tracking-wide mb-4"
        >
          {TITLES[kind]}
        </h3>
      )}
      {items.length === 0 ? (
        <p className="font-neutraface text-sm text-[#e4dfff]/50">Nothing here yet.</p>
      ) : (
        <ol className="flex flex-col gap-1" aria-labelledby={showTitle ? headingId : undefined}>
          {items.map((item, i) => {
            const subtitle = kind === "artists" ? null : item.artists?.join(", ");
            const content = (
              <>
                <span
                  aria-hidden="true"
                  className="w-5 shrink-0 text-right font-neutraface text-sm tabular-nums text-[#FFF0BE]/50"
                >
                  {i + 1}
                </span>
                <AlbumArt
                  src={item.image}
                  size={40}
                  rounded={kind === "artists" ? "rounded-full" : "rounded-md"}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-neutraface text-[15px] text-white">
                    {item.name}
                  </span>
                  {subtitle && (
                    <span className="block truncate font-neutraface text-xs text-[#e4dfff]/60">
                      {subtitle}
                    </span>
                  )}
                </span>
              </>
            );
            const rowClass =
              "flex items-center gap-3 rounded-lg px-2 py-1.5 -mx-2 transition-colors";
            return (
              <li key={`${item.name}-${i}`}>
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener"
                    className={`${rowClass} hover:bg-[#FFF0BE]/5 focus-visible:bg-[#FFF0BE]/5 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#FFF0BE]/40`}
                    aria-label={`${item.name}${subtitle ? ` by ${subtitle}` : ""} on Spotify (opens in a new tab)`}
                  >
                    {content}
                  </a>
                ) : (
                  <div className={rowClass}>{content}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
