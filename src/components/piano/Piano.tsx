"use client";
import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import { melody } from "./melody";

const WHITE_KEYS = ["C", "D", "E", "F", "G", "A", "B"];
const HAS_BLACK_KEY = ["C", "D", "F", "G", "A"]; // Note that black key is positioned to the right

type KeyType = {
  note: string;
  isBlack: boolean;
};

type OctaveData = {
  octave: number;
  whiteKeys: { note: string; hasBlack: boolean }[];
};

export default function Piano() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [numOctaves, setNumOctaves] = useState(4); // Default to 4 octaves (e.g. Octave 3 to 6)
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const samplerRef = useRef<Tone.Sampler | null>(null);
  const partRef = useRef<Tone.Part | null>(null);
  const activeSynths = useRef<Map<string, number>>(new Map());

  // 1. Calculate how many octaves we need based on container width
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        // Assume white key width is ~64px (md:w-16) on desktop.
        // 1 Octave = 7 white keys = 7 * 64 = 448px.
        const octavesNeeded = Math.ceil(width / 448);
        // We want an odd number of octaves or just enough to cover, centered around octave 4-5.
        // E.g., if we need 4, we render 4. If we need 8, we render 8.
        // Let's cap at 8 octaves total (Piano goes from Octave 1 to 8 usually).
        const finalOctaves = Math.min(Math.max(octavesNeeded + 1, 4), 8);
        setNumOctaves(finalOctaves);
      }
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // 2. Setup Tone.js
  useEffect(() => {
    // Setup Reverb and Sampler
    const reverb = new Tone.Reverb({
      decay: 3.5,
      preDelay: 0.01,
    }).toDestination();

    const sampler = new Tone.Sampler({
      urls: {
        A0: "A0.mp3",
        C1: "C1.mp3",
        "D#1": "Ds1.mp3",
        "F#1": "Fs1.mp3",
        A1: "A1.mp3",
        C2: "C2.mp3",
        "D#2": "Ds2.mp3",
        "F#2": "Fs2.mp3",
        A2: "A2.mp3",
        C3: "C3.mp3",
        "D#3": "Ds3.mp3",
        "F#3": "Fs3.mp3",
        A3: "A3.mp3",
        C4: "C4.mp3",
        "D#4": "Ds4.mp3",
        "F#4": "Fs4.mp3",
        A4: "A4.mp3",
        C5: "C5.mp3",
        "D#5": "Ds5.mp3",
        "F#5": "Fs5.mp3",
        A5: "A5.mp3",
        C6: "C6.mp3",
        "D#6": "Ds6.mp3",
        "F#6": "Fs6.mp3",
        A6: "A6.mp3",
        C7: "C7.mp3",
        "D#7": "Ds7.mp3",
        "F#7": "Fs7.mp3",
        A7: "A7.mp3",
        C8: "C8.mp3",
      },
      baseUrl: "https://tonejs.github.io/audio/salamander/",
      release: 1,
      onload: () => {
        setAudioReady(true);
      },
    }).connect(reverb);

    samplerRef.current = sampler;

    // Build the Tone.Part
    const part = new Tone.Part((time, noteInfo: any) => {
      if (samplerRef.current) {
        samplerRef.current.triggerAttackRelease(
          noteInfo.name,
          noteInfo.duration,
          time,
          noteInfo.velocity
        );

        // Visual feedback
        Tone.Draw.schedule(() => {
          triggerKeyVisual(noteInfo.name);
        }, time);
      }
    }, melody);

    partRef.current = part;

    return () => {
      sampler.dispose();
      reverb.dispose();
      part.dispose();
    };
  }, []);

  const triggerKeyVisual = (note: string) => {
    // Add a visual 'active' class to the DOM element
    // Since React state for 1300 notes playing fast would cause too many re-renders,
    // we use a direct DOM approach for performance.
    const escapedNote = note.replace("#", "\\#");
    const el = document.querySelector(`[data-note="${escapedNote}"]`);
    if (el) {
      el.classList.add("!bg-primary-fixed", "!shadow-[0_0_20px_rgba(241,226,177,0.5)]");
      // For white keys, it has bg-gradient, so we override it
      if (el.classList.contains("white-key")) {
        el.classList.add("!from-primary-fixed/50", "!to-primary-fixed");
      }
      setTimeout(() => {
        el.classList.remove(
          "!bg-primary-fixed",
          "!shadow-[0_0_20px_rgba(241,226,177,0.5)]",
          "!from-primary-fixed/50",
          "!to-primary-fixed"
        );
      }, 150); // slight visual decay
    }
  };

  const playNote = async (note: string) => {
    if (!audioReady) return;
    if (Tone.context.state !== "running") {
      await Tone.start();
    }
    if (samplerRef.current) {
      samplerRef.current.triggerAttackRelease(note, "2n");
      triggerKeyVisual(note);
    }
  };

  const togglePlayback = async () => {
    if (!audioReady) return;
    if (Tone.context.state !== "running") {
      await Tone.start();
    }

    if (isPlaying) {
      Tone.Transport.pause();
    } else {
      // Start transport
      if (Tone.Transport.state !== "started") {
        Tone.Transport.start();
      }
      if (partRef.current) {
        partRef.current.start(0);
      }
    }
    setIsPlaying(!isPlaying);
  };

  // 3. Generate Octaves dynamically
  const startOctave = Math.max(1, 4 - Math.floor(numOctaves / 2));
  
  const octaves: OctaveData[] = [];
  for (let i = 0; i < numOctaves; i++) {
    const currentOctave = startOctave + i;
    const whiteKeys = WHITE_KEYS.map((note) => ({
      note: `${note}${currentOctave}`,
      hasBlack: HAS_BLACK_KEY.includes(note),
    }));
    octaves.push({ octave: currentOctave, whiteKeys });
  }

  return (
    <section className="pt-12 pb-24 bg-gradient-to-b from-[#090C19] to-[#0d1226] relative w-full" id="piano-break">
      <div className="relative w-full overflow-hidden flex justify-center" ref={containerRef}>
        <div className="flex min-w-max [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_25%)] [mask-image:linear-gradient(to_bottom,transparent_0%,black_25%)]">
          {octaves.map((octaveData) =>
            octaveData.whiteKeys.map((wk, idx) => (
              <div
                key={wk.note}
                data-note={wk.note}
                onClick={() => playNote(wk.note)}
                className="piano-key white-key relative w-12 md:w-16 h-48 md:h-80 bg-gradient-to-b from-transparent to-white/10 border-x border-b border-t-0 border-white/10 rounded-b-xl backdrop-blur-md flex-shrink-0 cursor-pointer transition-colors duration-150 hover:bg-white/20"
                style={{ zIndex: 100 - idx }}
              >
                {wk.hasBlack && (
                  <div
                    data-note={`${wk.note.charAt(0)}#${octaveData.octave}`}
                    onClick={(e) => {
                      e.stopPropagation(); // prevent white key click
                      playNote(`${wk.note.charAt(0)}#${octaveData.octave}`);
                    }}
                    className="piano-key black-key absolute top-0 -right-4 md:-right-5 w-8 md:w-10 h-32 md:h-48 bg-[#090C19] border-x border-b border-t-0 border-[#5f2fbd]/40 rounded-b-lg shadow-inner z-20 cursor-pointer transition-colors duration-150 hover:bg-[#5f2fbd]/50"
                  ></div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-12 flex justify-center transition-opacity duration-1000">
        <button
          onClick={togglePlayback}
          className={`flex items-center gap-3 px-6 py-3 rounded-full border text-[#FFF0BE] font-neutraface tracking-widest text-xs uppercase transition-all shadow-[0_0_20px_rgba(255,240,190,0.15)] z-50 ${
            audioReady
              ? "bg-[#180164] border-[#FFF0BE]/20 hover:bg-[#180164]/80 cursor-pointer"
              : "bg-[#180164]/50 border-white/10 cursor-not-allowed opacity-50"
          }`}
          disabled={!audioReady}
        >
          <span className="w-4 h-4 flex items-center justify-center">
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
              </svg>
            )}
          </span>
          <span>{audioReady ? (isPlaying ? "Pause" : "Play") : "Loading Audio..."}</span>
        </button>
      </div>
    </section>
  );
}
