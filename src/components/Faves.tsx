import type { ReactNode } from "react";
import Image from "next/image";
import { currentFaves, topMovies, type CurrentFave, type TopMovie } from "@/data/faves";
import { findPoster } from "@/lib/posters";
import SpotifyNowPlaying from "@/components/spotify/SpotifyNowPlaying";
import SpotifyTop from "@/components/spotify/SpotifyTop";
import SpotifyUpdatedCaption from "@/components/spotify/SpotifyUpdatedCaption";

/** Small-caps label followed by a gold hairline that fades out: separates the blocks without boxes. */
function Rule({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <div className="mb-10 flex items-center gap-5">
      <h3
        id={id}
        className="whitespace-nowrap font-neutraface uppercase tracking-widest text-xs text-[#FFF0BE]/70"
      >
        {children}
      </h3>
      <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-[#FFF0BE]/25 to-transparent" />
    </div>
  );
}

// "reading X by Y", "watching X", ...
const VERBS: Record<CurrentFave["kind"], string> = {
  book: "reading",
  film: "watching",
  tv: "bingeing",
  music: "playing",
};

function Fave({ fave }: { fave: CurrentFave }) {
  return (
    <>
      {VERBS[fave.kind]}{" "}
      <em className="not-italic text-[#FFF0BE]">{fave.title}</em>
      {fave.creator && <span className="text-[#e4dfff]/55"> by {fave.creator}</span>}
      {fave.kind === "music" && " on repeat"}
    </>
  );
}

/** "Lately I'm reading A, watching B, and playing C on repeat." */
function CurrentlySentence({ faves }: { faves: CurrentFave[] }) {
  return (
    <p className="max-w-5xl font-neutraface text-2xl md:text-4xl leading-snug md:leading-[1.3] tracking-tight text-white text-pretty">
      Lately I&apos;m{" "}
      {faves.map((fave, i) => (
        <span key={`${fave.kind}-${fave.title}`}>
          {i > 0 && (i === faves.length - 1 ? (faves.length > 2 ? ", and " : " and ") : ", ")}
          <Fave fave={fave} />
        </span>
      ))}
      .
    </p>
  );
}

async function Poster({ movie }: { movie: TopMovie }) {
  const src = movie.poster ?? (await findPoster(movie.title, movie.year));
  return (
    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-[#151a33] ring-1 ring-white/10 shadow-[0_28px_60px_-20px_rgba(0,0,0,0.9)] transition-transform duration-500 ease-out motion-safe:group-hover:-translate-y-2 motion-safe:group-hover:-rotate-1">
      {src ? (
        <Image
          src={src}
          alt={`Poster for ${movie.title}`}
          fill
          unoptimized
          sizes="(min-width: 1024px) 18vw, 45vw"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center p-4 text-center font-neutraface text-lg text-[#FFF0BE]/70">
          {movie.title}
        </div>
      )}
      {/* soft vignette so the numeral reads on bright posters */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent" />
    </div>
  );
}

export default function Faves() {
  const movies = topMovies.filter((m) => m.title.trim() && m.title !== "TODO");

  return (
    <section
      id="faves"
      className="relative isolate overflow-hidden py-32 px-8 md:px-24 bg-[#121636] border-y border-[#FFF0BE]/10"
    >
      {/* Backdrop: a couple of faint coloured lights so the section reads as its own room. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-40 h-[36rem] w-[36rem] rounded-full bg-[#5521b3]/20 blur-[120px]" />
        <div className="absolute bottom-0 right-[-10rem] h-[30rem] w-[30rem] rounded-full bg-[#FFF0BE]/[0.06] blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto w-full">
        <h2 className="font-custom uppercase text-4xl md:text-5xl font-bold tracking-tighter text-white">
          Faves
        </h2>
        <div className="w-24 h-1 bg-primary-fixed mt-4 mb-4"></div>
        <p className="font-neutraface text-white/80 mb-20">
          What&apos;s been on repeat, on screen and on my nightstand lately.
        </p>

        {/* Now playing */}
        <div className="mb-28">
          <SpotifyNowPlaying />
        </div>

        {/* Currently */}
        <section aria-labelledby="faves-current" className="mb-28">
          <Rule id="faves-current">Currently</Rule>
          <CurrentlySentence faves={currentFaves} />
        </section>

        {/* On repeat */}
        <section aria-labelledby="faves-spotify" className="mb-28">
          <Rule id="faves-spotify">On repeat · last 4 weeks</Rule>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-y-12 lg:gap-x-0">
            <div className="lg:pr-10">
              <SpotifyTop kind="tracks" />
            </div>
            <div className="border-t border-[#FFF0BE]/10 pt-12 lg:border-t-0 lg:pt-0 lg:border-l lg:px-10">
              <SpotifyTop kind="artists" />
            </div>
            <div className="border-t border-[#FFF0BE]/10 pt-12 lg:border-t-0 lg:pt-0 lg:border-l lg:pl-10">
              <SpotifyTop kind="albums" />
            </div>
          </div>
          <SpotifyUpdatedCaption className="mt-10" />
        </section>

        {/* Top movies */}
        {movies.length > 0 && (
          <section aria-labelledby="faves-movies">
            <Rule id="faves-movies">Top {movies.length} films, all time</Rule>
            <ol className="-mx-8 px-8 scroll-px-8 md:-mx-24 md:px-24 md:scroll-px-24 lg:mx-0 lg:px-0 flex lg:grid lg:grid-cols-5 gap-5 lg:gap-8 overflow-x-auto lg:overflow-visible snap-x snap-mandatory overscroll-x-contain pb-4 lg:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {movies.map((movie) => (
                <li
                  key={movie.rank}
                  className="group relative shrink-0 w-[44vw] max-w-[220px] sm:w-[30vw] lg:w-auto lg:max-w-none snap-start pl-6 pt-2"
                >
                  <Poster movie={movie} />
                  <span
                    aria-hidden="true"
                    className="rank-outline pointer-events-none absolute left-0 bottom-[3.25rem] font-custom text-7xl md:text-8xl leading-none drop-shadow-[0_6px_18px_rgba(0,0,0,0.6)]"
                  >
                    {movie.rank}
                  </span>
                  <p className="mt-4 font-neutraface">
                    <span className="sr-only">#{movie.rank}: </span>
                    <span className="block text-base text-white leading-snug line-clamp-2">{movie.title}</span>
                    {movie.year && <span className="block text-sm text-[#e4dfff]/55">{movie.year}</span>}
                    {movie.note && <span className="block text-xs text-[#e4dfff]/50 mt-1">{movie.note}</span>}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </section>
  );
}
