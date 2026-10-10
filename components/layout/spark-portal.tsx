"use client";

import { useEffect, useRef } from "react";

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  width: number;
}

const MAX_SPARKS = 240;
const OPEN_MS = 750; // the portal bursts open over this long, then keeps spinning
const SPIN = 5.2; // radians per second the hot spots travel around the ring

/**
 * White-hot → yellow → orange → deep red as a spark cools. On light
 * backgrounds the sparks start at orange instead, so they don't wash out.
 */
function sparkColor(t: number, alpha: number, onDark: boolean) {
  const hue = onDark ? 52 - t * 40 : 38 - t * 30;
  const light = onDark ? 92 - t * 42 : 52 - t * 14;
  return `hsla(${hue}, 100%, ${light}%, ${alpha})`;
}

const easeOutBack = (t: number) => {
  const c = 1.9;
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
};

/**
 * A spinning ring of sparks around the logo, like a sorcerer's portal: it bursts
 * open on load, then sparks keep racing round the rim and flying off. Drawn on a
 * small canvas, paused while off-screen or in a hidden tab; a still glowing ring
 * for visitors who prefer reduced motion.
 */
export function SparkPortal() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const size = canvas.clientWidth;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    ctx.scale(dpr, dpr);
    const center = size / 2;
    const fullRadius = size * 0.36;

    const sparks: Spark[] = [];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Follows the theme (and dark areas such as the footer) as it changes.
    let onDark = true;
    const color = (t: number, alpha: number) => sparkColor(t, alpha, onDark);

    const drawRim = (radius: number, alpha: number) => {
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.shadowColor = color(0.4, 0.9 * alpha);
      ctx.shadowBlur = 6;
      ctx.lineWidth = 3;
      ctx.strokeStyle = color(0.35, 0.45 * alpha);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = color(0.05, 0.9 * alpha);
      ctx.stroke();
    };

    if (reduceMotion) {
      onDark = canvas.closest(".dark") !== null;
      drawRim(fullRadius, 1);
      return;
    }

    let frame = 0;
    let running = false;
    let start = 0;
    let last = 0;
    let visible = true;

    const emit = (radius: number, time: number, count: number) => {
      for (let i = 0; i < count && sparks.length < MAX_SPARKS; i++) {
        // Three hot spots race round the rim; most sparks come from near them.
        const spot = Math.floor(Math.random() * 3);
        const angle = time * SPIN + (spot * Math.PI * 2) / 3 + (Math.random() - 0.5) * 1.6;
        const speed = 34 + Math.random() * 60; // px per second, along the rim
        const outward = 6 + Math.random() * 30; // always fling away from the centre
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        sparks.push({
          x: center + cos * radius,
          y: center + sin * radius,
          // Tangent (spin direction) plus a little outward fling.
          vx: -sin * speed + cos * outward,
          vy: cos * speed + sin * outward,
          age: 0,
          life: 0.3 + Math.random() * 0.5,
          width: 1 + Math.random() * 1.4,
        });
      }
    };

    const tick = (now: number) => {
      if (!running) return;
      if (!start) start = last = now;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const time = (now - start) / 1000;
      const opening = Math.min((now - start) / OPEN_MS, 1);
      const radius = fullRadius * Math.max(0, easeOutBack(opening));

      ctx.clearRect(0, 0, size, size);
      onDark = canvas.closest(".dark") !== null;
      // Additive blending makes overlapping sparks burn brighter on dark backgrounds.
      ctx.globalCompositeOperation = onDark ? "lighter" : "source-over";
      drawRim(radius, opening);
      emit(radius, time, opening < 1 ? 14 : 8);

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.age += dt;
        if (s.age >= s.life) {
          sparks.splice(i, 1);
          continue;
        }
        const px = s.x;
        const py = s.y;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        // Gentle drag, independent of frame rate.
        const drag = Math.pow(0.4, dt);
        s.vx *= drag;
        s.vy *= drag;
        const t = s.age / s.life;
        ctx.strokeStyle = color(t, 1 - t);
        ctx.lineWidth = s.width * (1 - t * 0.6);
        ctx.beginPath();
        // A short streak behind the spark reads as motion.
        ctx.moveTo(px - s.vx * dt * 2.5, py - s.vy * dt * 2.5);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
      frame = requestAnimationFrame(tick);
    };

    const update = () => {
      const shouldRun = visible && document.visibilityState === "visible";
      if (shouldRun && !running) {
        running = true;
        last = performance.now();
        frame = requestAnimationFrame(tick);
      } else if (!shouldRun && running) {
        running = false;
        cancelAnimationFrame(frame);
      }
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    observer.observe(canvas);
    document.addEventListener("visibilitychange", update);
    update();

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute -inset-[60%] -z-10 size-[220%]"
    />
  );
}
