import { useEffect, useRef } from 'react';

/**
 * StarCanvas
 * Fixed full-screen canvas rendered BEHIND all page content.
 *
 * Features:
 *  - ~200 twinkling star dots at random positions & sizes
 *  - Soft radial gradient bloom at bottom center (warm rose/maroon ambient glow)
 *
 * z-index 0, pointer-events none → completely passive.
 */

interface Star {
  x: number;
  y: number;
  vx: number;       // drift velocity x (px/sec)
  vy: number;       // drift velocity y (px/sec)
  radius: number;
  peakOpacity: number;
  minOpacity: number;
  opacity: number;
  speed: number;    // twinkle speed (radians/sec)
  phase: number;    // twinkle phase offset
}

const STAR_COUNT = 210;

function createStars(W: number, H: number): Star[] {
  return Array.from({ length: STAR_COUNT }, () => {
    const peak = 0.4 + Math.random() * 0.6;
    const minFraction = Math.random() < 0.4 ? 0.0 : 0.25;
    // Drift: 0.025–0.12 px/frame = ~1.5–7 px/sec at 60fps. Slow gentle float.
    const angle = Math.random() * Math.PI * 2;
    const driftSpeed = 0.025 + Math.random() * 0.095;
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: Math.cos(angle) * driftSpeed,
      vy: Math.sin(angle) * driftSpeed,
      radius: 0.4 + Math.random() * 1.5,
      peakOpacity: peak,
      minOpacity: peak * minFraction,
      opacity: 0,
      speed: 1.2 + Math.random() * 3.3,
      phase: Math.random() * Math.PI * 2,
    };
  });
}

/**
 * Soft full-width bottom ambient glow.
 * Simple radial gradient anchored at bottom center, stretched into a wide
 * flat ellipse via ctx.scale(). No clip, no stroke — just a smooth bloom.
 */
function drawBottomGlow(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const cx = W / 2;
  const cy = H;

  const rx = W * 1.1;
  const ry = H * 0.42;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, ry / rx);

  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  grad.addColorStop(0,    'rgba(136, 39, 15, 0.50)');
  grad.addColorStop(0.25, 'rgba(110, 30, 12, 0.35)');
  grad.addColorStop(0.50, 'rgba(70,  18,  7, 0.18)');
  grad.addColorStop(0.75, 'rgba(35,  10,  4, 0.06)');
  grad.addColorStop(1,    'rgba(19,  19, 22, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export default function StarCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setup = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      starsRef.current = createStars(canvas.width, canvas.height);
    };

    setup();

    const draw = (timestamp: number) => {
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1); // seconds, capped
      lastTimeRef.current = timestamp;

      const W = canvas.width;
      const H = canvas.height;

      // Clear with a fully transparent fill so the page bg shows through
      ctx.clearRect(0, 0, W, H);

      // ── STARS ──────────────────────────────────────────────────────────
      ctx.globalCompositeOperation = 'source-over';
      starsRef.current.forEach((star) => {
        // ── MOVE ──────────────────────────────────────────────────────────
        // vx/vy are px/frame — add directly, no dt needed here
        star.x += star.vx;
        star.y += star.vy;

        // Wrap around edges with a small buffer so stars don't pop in
        const pad = 2;
        if (star.x < -pad)  star.x = W + pad;
        if (star.x > W + pad) star.x = -pad;
        if (star.y < -pad)  star.y = H + pad;
        if (star.y > H + pad) star.y = -pad;

        // ── BLINK ─────────────────────────────────────────────────────────
        star.phase += star.speed * dt;
        const t = (Math.sin(star.phase) + 1) / 2; // 0 → 1
        star.opacity = star.minOpacity + (star.peakOpacity - star.minOpacity) * t;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity.toFixed(3)})`;
        ctx.fill();
      });

      // ── BOTTOM AMBIENT GLOW ────────────────────────────────────────────
      drawBottomGlow(ctx, W, H);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame((ts) => {
      lastTimeRef.current = ts;
      rafRef.current = requestAnimationFrame(draw);
    });

    const onResize = () => {
      setup();
    };

    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  );
}

