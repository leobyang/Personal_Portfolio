import * as THREE from "three";
import { mulberry32 } from "@/lib/sky";

function canvasTexture(size: number, paint: (ctx: CanvasRenderingContext2D, size: number) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  paint(ctx, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Soft, lumpy cloud made of many overlapping radial blobs. */
export function nebulaTexture(seed: number, rgb: [number, number, number], accent: [number, number, number]) {
  return canvasTexture(256, (ctx, size) => {
    const rand = mulberry32(seed);
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 46; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = Math.pow(rand(), 0.7) * size * 0.28;
      const x = size / 2 + Math.cos(angle) * dist;
      const y = size / 2 + Math.sin(angle) * dist * 0.7;
      const r = size * (0.08 + rand() * 0.2);
      const [cr, cg, cb] = rand() < 0.3 ? accent : rgb;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${cr},${cg},${cb},${0.05 + rand() * 0.06})`);
      g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    }
    // Fade the square edges out completely.
    ctx.globalCompositeOperation = "destination-in";
    const mask = ctx.createRadialGradient(size / 2, size / 2, size * 0.15, size / 2, size / 2, size / 2);
    mask.addColorStop(0, "rgba(0,0,0,1)");
    mask.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = mask;
    ctx.fillRect(0, 0, size, size);
  });
}

/** Warm projector glow. */
export function glowTexture(rgb: [number, number, number]) {
  return canvasTexture(128, (ctx, size) => {
    const [r, g, b] = rgb;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, `rgba(${r},${g},${b},1)`);
    gradient.addColorStop(0.25, `rgba(${r},${g},${b},0.45)`);
    gradient.addColorStop(0.6, `rgba(${r},${g},${b},0.1)`);
    gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  });
}

/** Vertical light shaft: bright at the bottom, fading upwards and to the sides. */
export function shaftTexture() {
  return canvasTexture(128, (ctx, size) => {
    const vertical = ctx.createLinearGradient(0, size, 0, 0);
    vertical.addColorStop(0, "rgba(255,226,180,1)");
    vertical.addColorStop(0.35, "rgba(220,200,255,0.35)");
    vertical.addColorStop(1, "rgba(200,190,255,0)");
    ctx.fillStyle = vertical;
    ctx.fillRect(0, 0, size, size);
    ctx.globalCompositeOperation = "destination-in";
    const horizontal = ctx.createLinearGradient(0, 0, size, 0);
    horizontal.addColorStop(0, "rgba(0,0,0,0)");
    horizontal.addColorStop(0.5, "rgba(0,0,0,1)");
    horizontal.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = horizontal;
    ctx.fillRect(0, 0, size, size);
  });
}
