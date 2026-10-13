"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Sphere, OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { BlogPost } from "@/lib/blog";

function RotatingGlobe() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001;
      meshRef.current.rotation.x += 0.0005;
    }
  });

  return (
    <Sphere args={[2, 64, 64]} ref={meshRef}>
      <meshBasicMaterial 
        color="#FFF0BE" 
        wireframe 
        transparent 
        opacity={0.05} 
      />
    </Sphere>
  );
}

export default function Planetarium({ post }: { post: BlogPost }) {
  const [isClosing, setIsClosing] = useState(false);
  const router = useRouter();

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      document.documentElement.style.scrollBehavior = 'auto';
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push("/#blog");
      }
      setTimeout(() => {
        document.documentElement.style.scrollBehavior = '';
      }, 500);
    }, 450); // wait for genie animation
  };

  return (
    <div className="w-full h-full relative flex items-center justify-center">
      <button 
        onClick={handleClose}
        className="absolute top-6 right-6 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-[#180164]/40 border border-[#FFF0BE]/20 backdrop-blur-md text-white hover:bg-primary-fixed hover:text-[#090C19] transition-all shadow-xl cursor-pointer"
      >
        <span className="material-symbols-outlined text-2xl font-bold">close</span>
      </button>
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <color attach="background" args={["#090C19"]} />
        <ambientLight intensity={0.5} />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <RotatingGlobe />
        
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>

      {/* Foreground Content */}
      <div 
        className={`absolute inset-0 pointer-events-none flex items-center justify-center p-4 md:p-8 transition-all duration-500 origin-bottom ${
          isClosing ? "opacity-0 scale-x-50 scale-y-0 translate-y-full blur-xl" : "opacity-100 scale-100 translate-y-0 blur-0"
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(0.6, -0.28, 0.735, 0.045)" }}
      >
        <div className="pointer-events-auto w-full max-w-3xl max-h-[85vh] overflow-y-auto glass-card rounded-3xl p-8 md:p-12 shadow-[0_0_50px_rgba(23,0,99,0.5)] border border-[#FFF0BE]/10 relative hide-scrollbar">
          
          <div className="text-center mb-12">
            <div className="font-neutraface text-primary-fixed tracking-widest uppercase text-sm mb-4">
              {post.date}
            </div>
            <h1 className="font-custom text-4xl md:text-6xl uppercase tracking-tighter text-white font-bold leading-none mb-6">
              {post.title}
            </h1>
            <div className="w-24 h-1 bg-primary-fixed mx-auto"></div>
          </div>

          <div 
            className="prose prose-invert prose-lg max-w-none font-neutraface text-on-surface-variant leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.contentHtml || "" }}
          />

        </div>
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
          font-family: var(--font-neutraface);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: white;
        }
        .prose a {
          color: #f1e2b1;
          text-decoration: underline;
          text-decoration-color: rgba(241, 226, 177, 0.3);
          transition: all 0.3s ease;
        }
        .prose a:hover {
          text-decoration-color: rgba(241, 226, 177, 1);
        }
      `}</style>
    </div>
  );
}
