"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showName, setShowName] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show the name once past the hero. It's a plain on/off switch; the CSS transition
      // on #nav-name runs at a fixed pace (900 ms), so even jumping straight to the bottom of the
      // page slides it in smoothly instead of snapping.
      setShowName(window.scrollY > 500);
    };
    
    handleScroll(); // Initialize on mount
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav
        id="main-nav"
        className="fixed top-0 left-1/2 -translate-x-1/2 z-50 flex items-center px-6 py-3 w-max max-w-[calc(100%-2rem)] bg-[#180164]/40 backdrop-blur-2xl rounded-full border border-[#FFF0BE]/10 mt-6 shadow-[0_20px_50px_rgba(23,0,99,0.5)]"
      >
        <div 
          id="nav-name" 
          // Animating a 0fr → 1fr grid column eases to the name's exact width.
          className={`grid transition-[grid-template-columns,opacity] duration-[900ms] ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-opacity motion-reduce:duration-300 ${
            showName ? "grid-cols-[1fr] opacity-100" : "grid-cols-[0fr] opacity-0"
          }`}
          aria-hidden={!showName}
        >
          <div className="min-w-0 overflow-hidden">
          <Link
            href="#"
            tabIndex={showName ? undefined : -1}
            className="block text-lg font-bold tracking-widest text-white font-neutraface uppercase whitespace-nowrap pr-8 hover:text-[#FFF0BE] transition-colors"
          >
            Leo Yang
          </Link>
          </div>
        </div>
        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-6 lg:pr-8">
          <Link
            className="font-neutraface tracking-tighter uppercase text-sm text-[#FFF0BE]/50 hover:text-[#FFF0BE] transition-all"
            href="#about"
          >
            About Me
          </Link>
          <Link
            className="font-neutraface tracking-tighter uppercase text-sm text-[#FFF0BE]/50 hover:text-[#FFF0BE] transition-all"
            href="#faves"
          >
            Faves
          </Link>
          <Link
            className="font-neutraface tracking-tighter uppercase text-sm text-[#FFF0BE]/50 hover:text-[#FFF0BE] transition-all"
            href="#experience"
          >
            Experience
          </Link>
          <Link
            className="font-neutraface tracking-tighter uppercase text-sm text-[#FFF0BE]/50 hover:text-[#FFF0BE] transition-all"
            href="#blog"
          >
            Writings
          </Link>
          <Link
            className="font-neutraface tracking-tighter uppercase text-sm text-[#FFF0BE]/50 hover:text-[#FFF0BE] transition-all"
            href="#projects"
          >
            Projects
          </Link>
          <Link
            className="font-neutraface tracking-tighter uppercase text-sm text-[#FFF0BE]/50 hover:text-[#FFF0BE] transition-all"
            href="#contact"
          >
            Contact
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <a
            className="hidden sm:block bg-[#FFF0BE] text-[#38300e] px-4 py-1.5 rounded-full font-neutraface uppercase font-bold text-sm tracking-tight hover:brightness-110 transition-all"
            href="/assets/files/yang_leo_resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            Resume
          </a>
          {/* Hamburger Button (Mobile/Tablet) */}
          <button
            className="lg:hidden text-[#FFF0BE]/70 hover:text-[#FFF0BE] flex items-center justify-center p-1"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className="material-symbols-outlined text-3xl">menu</span>
          </button>
        </div>
      </nav>

      {/* Mobile/Tablet Dropdown */}
      <div
        className={`fixed top-24 left-1/2 w-[calc(100%-2rem)] max-w-lg z-[49] lg:hidden bg-[#180164]/95 backdrop-blur-2xl border border-[#FFF0BE]/10 rounded-2xl p-6 shadow-2xl transition-all duration-300 ${
          isMobileMenuOpen
            ? "opacity-100 pointer-events-auto translate-y-0 -translate-x-1/2"
            : "opacity-0 pointer-events-none -translate-y-2 -translate-x-1/2"
        }`}
      >
        <div className="flex flex-col gap-4 text-center">
          <Link
            className="py-3 font-neutraface text-lg tracking-widest uppercase text-[#FFF0BE]/70 hover:text-[#FFF0BE]"
            href="#about"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            About Me
          </Link>
          <Link
            className="py-3 font-neutraface text-lg tracking-widest uppercase text-[#FFF0BE]/70 hover:text-[#FFF0BE]"
            href="#faves"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Faves
          </Link>
          <Link
            className="py-3 font-neutraface text-lg tracking-widest uppercase text-[#FFF0BE]/70 hover:text-[#FFF0BE]"
            href="#experience"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Experience
          </Link>
          <Link
            className="py-3 font-neutraface text-lg tracking-widest uppercase text-[#FFF0BE]/70 hover:text-[#FFF0BE]"
            href="#blog"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Writings
          </Link>
          <Link
            className="py-3 font-neutraface text-lg tracking-widest uppercase text-[#FFF0BE]/70 hover:text-[#FFF0BE]"
            href="#projects"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Projects
          </Link>
          <Link
            className="py-3 font-neutraface text-lg tracking-widest uppercase text-[#FFF0BE]/70 hover:text-[#FFF0BE]"
            href="#contact"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Contact
          </Link>
          <a
            className="sm:hidden mt-4 bg-[#FFF0BE] text-[#38300e] px-6 py-3 rounded-full font-neutraface uppercase font-bold text-sm tracking-tight"
            href="/assets/files/yang_leo_resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            Resume
          </a>
        </div>
      </div>
    </>
  );
}
