import { useEffect, useState, useRef } from 'react';

export default function CustomCursor() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Position references for 60fps-120fps RAF lerp loop
  const mousePos = useRef({ x: -100, y: -100 });
  const circlePos = useRef({ x: -100, y: -100 });
  const dotRef = useRef<HTMLDivElement | null>(null);
  const circleRef = useRef<HTMLDivElement | null>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    // Disable custom cursor on touch/mobile devices
    const checkTouch = () => {
      return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches
      );
    };

    if (checkTouch()) {
      setIsTouchDevice(true);
      return;
    }

    const onMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);

      // Instantly position the small center dot
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      }
    };

    const onMouseDown = () => setIsMouseDown(true);
    const onMouseUp = () => setIsMouseDown(false);

    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    // Detect clickable/interactive elements under cursor
    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactive = target.closest(
        'a, button, input, textarea, select, [role="button"], .cursor-pointer, [data-cursor="pointer"]'
      );
      setIsHovered(Boolean(interactive));
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('mouseenter', onMouseEnter);
    document.addEventListener('mouseover', onMouseOver, { passive: true });

    // Smooth physics loop for the trailing circle follower
    const render = () => {
      const lerpFactor = 0.18;
      circlePos.current.x += (mousePos.current.x - circlePos.current.x) * lerpFactor;
      circlePos.current.y += (mousePos.current.y - circlePos.current.y) * lerpFactor;

      if (circleRef.current) {
        circleRef.current.style.transform = `translate3d(${circlePos.current.x}px, ${circlePos.current.y}px, 0) translate(-50%, -50%)`;
      }

      rafId.current = requestAnimationFrame(render);
    };

    rafId.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('mouseenter', onMouseEnter);
      document.removeEventListener('mouseover', onMouseOver);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [isVisible]);

  if (isTouchDevice) return null;

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-[99999] overflow-hidden transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden="true"
    >
      {/* ── SMOOTH TRAILING OUTER CIRCLE ── */}
      <div
        ref={circleRef}
        className="fixed top-0 left-0 pointer-events-none will-change-transform transition-[width,height,background-color,border-color] duration-200 ease-out rounded-full flex items-center justify-center"
        style={{
          width: isHovered ? '48px' : isMouseDown ? '26px' : '36px',
          height: isHovered ? '48px' : isMouseDown ? '26px' : '36px',
          border: isHovered
            ? '1.5px solid rgba(255, 180, 163, 0.8)'
            : '1px solid rgba(255, 255, 255, 0.35)',
          backgroundColor: isHovered
            ? 'rgba(255, 180, 163, 0.12)'
            : isMouseDown
            ? 'rgba(255, 255, 255, 0.15)'
            : 'rgba(255, 255, 255, 0.03)',
          backdropFilter: isHovered ? 'blur(1px)' : 'none',
          boxShadow: isHovered
            ? '0 0 20px rgba(255, 180, 163, 0.3)'
            : '0 0 10px rgba(0, 0, 0, 0.2)',
        }}
      />

      {/* ── INNER PINPOINT DOT ── */}
      <div
        ref={dotRef}
        className={`fixed top-0 left-0 pointer-events-none will-change-transform rounded-full transition-transform duration-75 ${
          isHovered
            ? 'w-1.5 h-1.5 bg-secondary'
            : isMouseDown
            ? 'w-1 h-1 bg-white'
            : 'w-1.5 h-1.5 bg-primary shadow-[0_0_8px_rgba(255,255,255,0.8)]'
        }`}
      />
    </div>
  );
}

