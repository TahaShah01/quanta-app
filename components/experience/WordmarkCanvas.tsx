"use client";

import { useEffect, useRef, type MutableRefObject } from "react";

export interface WordmarkApi {
  /** Scatter the particles outward (used as the intro opens). */
  burst: () => void;
}

interface WordmarkCanvasProps {
  text: string;
  apiRef: MutableRefObject<WordmarkApi | null>;
}

/**
 * The intro's own particle field: dust gathers into the brand name.
 * Self-contained 2D canvas, so it never depends on the page's 3D scene.
 */
export function WordmarkCanvas({ text, apiRef }: WordmarkCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    let bursting = false;
    let burstAt = 0;
    const pointer = { x: -9999, y: -9999 };

    const color = getComputedStyle(canvas).color || "#fff";
    const small = window.innerWidth < 768;
    const COUNT = small ? 1500 : 2800;

    const px = new Float32Array(COUNT);
    const py = new Float32Array(COUNT);
    const tx = new Float32Array(COUNT);
    const ty = new Float32Array(COUNT);
    const vx = new Float32Array(COUNT);
    const vy = new Float32Array(COUNT);
    const stiff = new Float32Array(COUNT);
    const delay = new Float32Array(COUNT);
    const size = new Float32Array(COUNT);

    const sample = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const probe = document.createElement("canvas");
      probe.width = width;
      probe.height = height;
      const pctx = probe.getContext("2d");
      if (!pctx) return;

      const label = text.toUpperCase();
      const family = "system-ui, -apple-system, 'Segoe UI', Arial, sans-serif";
      pctx.font = `700 200px ${family}`;
      const measured = pctx.measureText(label).width || 1;
      const targetWidth = Math.min(width * 0.82, 1300);
      const fontSize = (200 * targetWidth) / measured;
      pctx.font = `700 ${fontSize}px ${family}`;
      pctx.textAlign = "center";
      pctx.textBaseline = "middle";
      pctx.fillStyle = "#fff";
      pctx.fillText(label, width / 2, height * 0.46);

      const data = pctx.getImageData(0, 0, width, height).data;
      const points: number[] = [];
      const step = 2;
      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          if (data[(y * width + x) * 4 + 3] > 128) points.push(x, y);
        }
      }
      const total = points.length / 2;
      for (let i = 0; i < COUNT; i++) {
        const k = total ? Math.floor(Math.random() * total) * 2 : 0;
        tx[i] = total ? points[k] : width / 2;
        ty[i] = total ? points[k + 1] : height / 2;
        // Start on a loose ring around the edge, swirling inward.
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.max(width, height) * (0.55 + Math.random() * 0.5);
        px[i] = width / 2 + Math.cos(angle) * radius;
        py[i] = height / 2 + Math.sin(angle) * radius;
        vx[i] = -Math.sin(angle) * 60;
        vy[i] = Math.cos(angle) * 60;
        stiff[i] = 9 + Math.random() * 10;
        delay[i] = Math.random() * 0.9;
        size[i] = 1.1 + Math.random() * 1.3;
      }
    };

    sample();

    const onResize = () => {
      sample();
      elapsed = 0;
    };
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      pointer.x = pointer.y = -9999;
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);

    apiRef.current = {
      burst: () => {
        if (bursting) return;
        bursting = true;
        burstAt = elapsed;
        for (let i = 0; i < COUNT; i++) {
          const angle = Math.atan2(py[i] - height / 2, px[i] - width / 2) + (Math.random() - 0.5);
          const speed = 400 + Math.random() * 900;
          vx[i] = Math.cos(angle) * speed;
          vy[i] = Math.sin(angle) * speed;
        }
      },
    };

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      elapsed += dt;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = color;

      const fade = bursting ? Math.max(0, 1 - (elapsed - burstAt) / 0.55) : 1;
      ctx.globalAlpha = 0.9 * fade;

      for (let i = 0; i < COUNT; i++) {
        if (bursting) {
          px[i] += vx[i] * dt;
          py[i] += vy[i] * dt;
        } else if (elapsed >= delay[i]) {
          let ax = (tx[i] - px[i]) * stiff[i];
          let ay = (ty[i] - py[i]) * stiff[i];
          const dx = px[i] - pointer.x;
          const dy = py[i] - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 8100) {
            const force = (1 - Math.sqrt(d2) / 90) * 2600;
            const d = Math.sqrt(d2) || 1;
            ax += (dx / d) * force;
            ay += (dy / d) * force;
          }
          vx[i] = (vx[i] + ax * dt) * Math.exp(-6.5 * dt);
          vy[i] = (vy[i] + ay * dt) * Math.exp(-6.5 * dt);
          px[i] += vx[i] * dt;
          py[i] += vy[i] * dt;
        }
        ctx.fillRect(px[i], py[i], size[i], size[i]);
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      apiRef.current = null;
    };
  }, [text, apiRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full text-[var(--foreground)]"
    />
  );
}
