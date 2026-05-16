"use client";

import { useEffect, useRef } from "react";

interface Ball {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  rotation: number;
  rotSpeed: number;
  emoji: string;
}

const EMOJIS = ["⚽", "⚽", "⚽", "⚽", "⚽", "⚽", "⚽", "⚽", "⚽", "🏆", "⭐", "🥇", "🔥", "🥅"];

export default function PhysicsBalls({ count = 14 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Spawn balls above screen so they fall in
    const balls: Ball[] = Array.from({ length: count }, (_, i) => ({
      x: 60 + Math.random() * Math.max(100, window.innerWidth - 120),
      y: -80 - Math.random() * 500,
      vx: (Math.random() - 0.5) * 5,
      vy: Math.random() * 4 + 1,
      r: 20 + Math.random() * 20,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.12,
      emoji: EMOJIS[i % EMOJIS.length],
    }));

    let mouseX = -9999, mouseY = -9999;

    const onMove = (e: MouseEvent) => { mouseX = e.clientX; mouseY = e.clientY; };
    const onTouch = (e: TouchEvent) => {
      if (e.touches[0]) { mouseX = e.touches[0].clientX; mouseY = e.touches[0].clientY; }
    };
    const onLeave = () => { mouseX = -9999; mouseY = -9999; };

    // Click = explosion
    const onInteract = (cx: number, cy: number) => {
      for (const ball of balls) {
        const dx = ball.x - cx, dy = ball.y - cy;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = Math.max(0, (350 - d) / 350) * 30;
        if (force > 0) {
          ball.vx += (dx / d) * force;
          ball.vy += (dy / d) * force - 6;
        }
      }
    };
    const onClick = (e: MouseEvent) => onInteract(e.clientX, e.clientY);
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches[0]) onInteract(e.touches[0].clientX, e.touches[0].clientY);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("click", onClick);
    window.addEventListener("touchstart", onTouchStart, { passive: true });

    let raf: number;

    function tick() {
      const W = canvas!.width, H = canvas!.height;
      ctx.clearRect(0, 0, W, H);

      for (const b of balls) {
        // Gravity
        b.vy += 0.4;

        // Mouse / touch repulsion
        const dx = b.x - mouseX, dy = b.y - mouseY;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 220 && d > 0) {
          const power = Math.pow(1 - d / 220, 1.8) * 14;
          b.vx += (dx / d) * power;
          b.vy += (dy / d) * power;
        }

        // Speed cap
        const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (spd > 20) { b.vx *= 20 / spd; b.vy *= 20 / spd; }

        b.x += b.vx;
        b.y += b.vy;
        b.rotation += b.rotSpeed + (b.vx > 0 ? 1 : -1) * Math.abs(b.vx) * 0.025;

        // Bounce
        const rest = 0.6, fric = 0.85;
        if (b.x - b.r < 0)  { b.x = b.r;     b.vx =  Math.abs(b.vx) * rest; }
        if (b.x + b.r > W)  { b.x = W - b.r; b.vx = -Math.abs(b.vx) * rest; }
        if (b.y - b.r < 0)  { b.y = b.r;     b.vy =  Math.abs(b.vy) * rest; }
        if (b.y + b.r > H)  { b.y = H - b.r; b.vy = -Math.abs(b.vy) * rest; b.vx *= fric; }

        // Draw shadow
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.25)";
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 4;
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rotation);
        ctx.font = `${b.r * 2}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(b.emoji, 0, 0);
        ctx.restore();
      }

      raf = requestAnimationFrame(tick);
    }

    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("click", onClick);
      window.removeEventListener("touchstart", onTouchStart);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
}
