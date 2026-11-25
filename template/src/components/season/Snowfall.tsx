/**
 * Light snowfall over the page: one fixed canvas that never catches clicks.
 * About 30 frames a second, paused when the tab is hidden, and nothing at all
 * for people who ask their device for less motion.
 */
import React, { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../../config/season';

interface Flake { x: number; y: number; r: number; vy: number; sway: number; phase: number; a: number }

const Snowfall: React.FC<{ density?: number }> = ({ density = 1 }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || prefersReducedMotion()) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0, h = 0, raf = 0, last = 0;
    let flakes: Flake[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const make = (anywhere: boolean): Flake => {
      const r = 0.8 + Math.random() * 2.2;
      return {
        x: Math.random() * w,
        y: anywhere ? Math.random() * h : -6,
        r,
        vy: 14 + r * 11 + Math.random() * 10,
        sway: 8 + Math.random() * 18,
        phase: Math.random() * Math.PI * 2,
        a: 0.45 + Math.random() * 0.45,
      };
    };

    const resize = () => {
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.round(Math.min(90, (w * h) / 22000) * density);
      while (flakes.length < target) flakes.push(make(true));
      flakes.length = target;
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last < 33) return;
      const dt = Math.min((now - (last || now)) / 1000, 0.1);
      last = now;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];
        f.y += f.vy * dt;
        f.phase += dt * 0.9;
        const x = f.x + Math.sin(f.phase) * f.sway;
        if (f.y > h + 6) { flakes[i] = make(false); continue; }
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${f.a})`;
        ctx.shadowColor = 'rgba(166,25,46,0.35)';
        ctx.shadowBlur = 2;
        ctx.arc(x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) { last = 0; raf = requestAnimationFrame(tick); }
    };

    resize();
    raf = requestAnimationFrame(tick);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [density]);

  return <canvas ref={ref} className="sl-snow" aria-hidden="true" />;
};

export default Snowfall;
