"use client";
import { useEffect, useRef } from "react";

export default function StarCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // We define a particle type
    type Particle = {
      x: number;
      y: number;
      size: number;
      life: number;
      velX: number;
      velY: number;
      rotation: number;
      rotSpeed: number;
    };

    let particles: Particle[] = [];
    let animationFrameId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    let mouse = { x: 0, y: 0 };
    let lastMouse = { x: 0, y: 0 };

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;

      const dist = Math.hypot(mouse.x - lastMouse.x, mouse.y - lastMouse.y);
      if (dist > 15) {
        particles.push({
          x: mouse.x,
          y: mouse.y,
          size: Math.random() * 2 + 1.5,
          life: 1,
          velX: (Math.random() - 0.5) * 0.5,
          velY: (Math.random() - 0.5) * 0.5 + 0.2, // slight downward drift
          rotation: 0,
          rotSpeed: 0,
        });
        if (particles.length > 5) particles.shift();
        lastMouse = { x: mouse.x, y: mouse.y };
      }
    };
    window.addEventListener("mousemove", onMouseMove);

    const drawStar = (x: number, y: number, radius: number, opacity: number, rotation: number) => {
      ctx.save();
      ctx.beginPath();
      ctx.translate(x, y);
      ctx.globalAlpha = opacity;
      ctx.fillStyle = "#FFF0BE";
      ctx.shadowBlur = 4;
      ctx.shadowColor = "#FFF0BE";
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const animateParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        let p = particles[i];
        p.x += p.velX;
        p.y += p.velY;
        p.life -= 0.05; // fade speed
        p.rotation += p.rotSpeed;

        if (p.life <= 0) {
          particles.splice(i, 1);
          i--;
          continue;
        }

        drawStar(p.x, p.y, p.size * p.life, p.life, p.rotation);
      }
      animationFrameId = requestAnimationFrame(animateParticles);
    };
    animateParticles();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  );
}
