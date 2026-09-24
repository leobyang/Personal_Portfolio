import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Experience from "@/components/Experience";
import Piano from "@/components/piano/Piano";
import BlogOverview from "@/components/BlogOverview";
import Projects from "@/components/Projects";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import StarCursor from "@/components/StarCursor";

export default function Home() {
  return (
    <>
      <StarCursor />
      
      {/* Subtle Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay z-[100]">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <filter id="noise">
            <feTurbulence baseFrequency="0.65" numOctaves={3} stitchTiles="stitch" type="fractalNoise" />
          </filter>
          <rect filter="url(#noise)" height="100%" width="100%"></rect>
        </svg>
      </div>

      <Navbar />

      <main className="relative z-10 flex-grow">
        <Hero />
        <About />
        <Experience />
        <Piano />
        <BlogOverview />
        <Projects />
        <Contact />
      </main>

      <Footer />
    </>
  );
}
