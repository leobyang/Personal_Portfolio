import type { ReactNode } from "react";
import { currentFaves, topMovies, type FaveKind } from "@/data/faves";
import SpotifyNowPlaying from "@/components/spotify/SpotifyNowPlaying";
import SpotifyTop from "@/components/spotify/SpotifyTop";
import SpotifyUpdatedCaption from "@/components/spotify/SpotifyUpdatedCaption";

const tile = "rounded-3xl bg-[#0d1226] border border-[#FFF0BE]/10 p-6 md:p-8";

function TileHeading({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h3 id={id} className="font-neutraface text-sm text-[#FFF0BE]/70 tracking-wide mb-5">
      {children}
    </h3>
  );
}

function FaveIcon({ kind }: { kind: FaveKind }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "#FFF0BE",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (kind) {
    case "book":
      return (
        <svg {...common}>
          <path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Z" />
          <path d="M4 19.5A2 2 0 0 0 6 21.5h13" />
          <path d="M9 7h6" />
        </svg>
      );
    case "film":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" />
        </svg>
      );
    case "music":
      return (
        <svg {...common}>
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      );
    case "tv":
      return (
        <svg {...common}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="m8 3 4 4 4-4" />
        </svg>
      );
  }
}

export default function Faves() {
  const movies = topMovies.filter((m) => m.title.trim() && m.title !== "TODO");

  return (
    <section className="py-32 px-8 md:px-24 bg-[#090C19]" id="faves">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="font-custom uppercase text-4xl md:text-5xl font-bold tracking-tighter text-white">
          Faves
        </h2>
        <div className="w-24 h-1 bg-primary-fixed mt-4 mb-4"></div>
        <p className="font-neutraface text-white mb-12">
          What&apos;s been on repeat, on screen and on my nightstand lately.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {/* Now playing / last played */}
          <div className={`${tile} md:col-span-2`}>
            <TileHeading>On Spotify</TileHeading>
            <SpotifyNowPlaying />
          </div>

          {/* Currently into */}
          <div className={`${tile} md:col-span-2 lg:col-span-1`}>
            <TileHeading id="faves-current">Currently into</TileHeading>
            <ul aria-labelledby="faves-current" className="grid grid-cols-2 lg:grid-cols-1 gap-x-4 gap-y-4">
              {currentFaves.map((fave) => (
                <li key={fave.kind} className="flex items-center gap-3 min-w-0">
                  <span className="grid place-items-center w-10 h-10 shrink-0 rounded-full border border-[#FFF0BE]/15">
                    <FaveIcon kind={fave.kind} />
                  </span>
                  <span className="min-w-0 font-neutraface">
                    <span className="block text-[11px] text-[#FFF0BE]/50">{fave.label}</span>
                    <span className="block text-[15px] text-white leading-snug">{fave.title}</span>
                    {fave.creator && (
                      <span className="block text-xs text-[#e4dfff]/60">{fave.creator}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Spotify top lists */}
          <div className={tile}>
            <SpotifyTop kind="tracks" />
          </div>
          <div className={tile}>
            <SpotifyTop kind="artists" />
          </div>
          <div className={`${tile} md:col-span-2 lg:col-span-1`}>
            <SpotifyTop kind="albums" />
          </div>

          <SpotifyUpdatedCaption className="md:col-span-2 lg:col-span-3 -mt-1 px-2" />

          {/* Top movies */}
          {movies.length > 0 && (
            <div className={`${tile} md:col-span-2 lg:col-span-3`}>
              <TileHeading id="faves-movies">Top 5 movies</TileHeading>
              <ol
                aria-labelledby="faves-movies"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-x-6 gap-y-5"
              >
                {movies.map((movie) => (
                  <li key={movie.rank} className="flex items-baseline gap-4 min-w-0">
                    <span
                      aria-hidden="true"
                      className="font-custom text-5xl md:text-6xl leading-none text-[#FFF0BE]"
                    >
                      {movie.rank}
                    </span>
                    <span className="min-w-0 font-neutraface">
                      <span className="sr-only">#{movie.rank}: </span>
                      <span className="block text-base text-white leading-snug">{movie.title}</span>
                      {movie.year && <span className="block text-sm text-[#e4dfff]/60">{movie.year}</span>}
                      {movie.note && <span className="block text-xs text-[#e4dfff]/50 mt-1">{movie.note}</span>}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
