"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BlogPost } from "@/lib/blog";

type Star = {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  isPost: boolean;
  post?: BlogPost;
  pulseSpeed?: number;
};

export default function StarrySky({ posts }: { posts: BlogPost[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const [hoveredPost, setHoveredPost] = useState<BlogPost | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let stars: Star[] = [];

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
      initStars();
    };

    const initStars = () => {
      stars = [];
      // Generate background static stars
      const numBgStars = Math.floor((canvas.width * canvas.height) / 10000);
      for (let i = 0; i < numBgStars; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5,
          alpha: Math.random(),
          isPost: false,
        });
      }

      // Generate post stars (much brighter, slightly larger, pulsating)
      posts.forEach((post) => {
        // Keep them slightly away from edges
        const margin = 100;
        stars.push({
          x: margin + Math.random() * (canvas.width - margin * 2),
          y: margin + Math.random() * (canvas.height - margin * 2),
          radius: 3 + Math.random() * 2,
          alpha: 1,
          isPost: true,
          post,
          pulseSpeed: 0.02 + Math.random() * 0.02,
        });
      });
    };

    resize();
    window.addEventListener("resize", resize);

    let time = 0;
    const render = () => {
      time += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      stars.forEach((star) => {
        ctx.beginPath();
        let currentAlpha = star.alpha;
        let currentRadius = star.radius;

        if (star.isPost) {
          // Pulse effect for post stars
          currentAlpha = 0.5 + Math.abs(Math.sin(time * (star.pulseSpeed || 0.02))) * 0.5;
          ctx.shadowBlur = 15;
          ctx.shadowColor = "#f1e2b1";
          ctx.fillStyle = `rgba(241, 226, 177, ${currentAlpha})`;
        } else {
          ctx.shadowBlur = 0;
          ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
        }

        ctx.arc(star.x, star.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };
    render();

    // Interaction handlers
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePos({ x: e.clientX, y: e.clientY });

      let found = false;
      for (const star of stars) {
        if (star.isPost) {
          const dist = Math.hypot(star.x - x, star.y - y);
          if (dist < 15) { // Hover radius
            setHoveredPost(star.post!);
            canvas.style.cursor = "pointer";
            found = true;
            break;
          }
        }
      }
      if (!found) {
        setHoveredPost(null);
        canvas.style.cursor = "default";
      }
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      for (const star of stars) {
        if (star.isPost) {
          const dist = Math.hypot(star.x - x, star.y - y);
          if (dist < 15 && star.post) {
            router.push(`/blog/${star.post.id}`);
            break;
          }
        }
      }
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("click", handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, [posts, router]);

  return (
    <>
      <canvas ref={canvasRef} className="w-full h-full block" />
      
      {/* Tooltip */}
      {hoveredPost && (
        <div
          className="fixed z-50 pointer-events-none glass-card p-4 rounded-xl translate-x-4 -translate-y-1/2"
          style={{ top: mousePos.y, left: mousePos.x }}
        >
          <div className="font-neutraface text-[10px] text-primary-fixed uppercase tracking-widest mb-1">
            {hoveredPost.date}
          </div>
          <div className="font-custom text-white text-xl uppercase font-bold tracking-tight">
            {hoveredPost.title}
          </div>
        </div>
      )}
    </>
  );
}
