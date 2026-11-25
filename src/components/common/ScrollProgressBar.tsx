import { useEffect, useState } from 'react';

/**
 * ScrollProgressBar
 * A fixed 2px hairline at the very top of the viewport that grows from
 * left→right as the user scrolls down the page.
 *
 * z-[60] puts it above the header (z-50) and below the custom cursor.
 * Uses native scroll events — fast and lightweight.
 */
export default function ScrollProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY;
      const total =
        document.documentElement.scrollHeight - window.innerHeight;
      if (total <= 0) return;
      setProgress(Math.min((scrolled / total) * 100, 100));
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] h-[2px] pointer-events-none"
      aria-hidden="true"
    >
      {/* Track (faint background) */}
      <div className="absolute inset-0 bg-white/5" />

      {/* Fill bar */}
      <div
        className="h-full transition-none"
        style={{
          width: `${progress}%`,
          background:
            'linear-gradient(90deg, #ffb4a3 0%, #ff8c72 55%, #ffffff99 100%)',
          boxShadow: '0 0 8px 1px #ffb4a380, 0 0 20px 2px #ffb4a340',
        }}
      />
    </div>
  );
}

