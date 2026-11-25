import { useState, useEffect } from 'react';

/**
 * PageLoader
 * Minimal editorial entrance loader.
 * - Logo letter "C" animates in with scale
 * - Thin progress line fills below
 * - Curtain slides up to reveal page
 * - Unmounts completely when done
 */
export default function PageLoader() {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'holding' | 'exiting' | 'done'>('loading');

  useEffect(() => {
    const duration = 1400;
    const step = 16;
    const totalSteps = duration / step;
    let current = 0;

    const timer = setInterval(() => {
      current++;
      // Ease-out quad for smooth deceleration
      const t = Math.min(current / totalSteps, 1);
      const eased = Math.round(t * (2 - t) * 100);
      setProgress(eased);

      if (current >= totalSteps) {
        clearInterval(timer);
        setPhase('holding');
        // Brief hold at 100% before exit
        setTimeout(() => {
          setPhase('exiting');
          setTimeout(() => setPhase('done'), 600);
        }, 200);
      }
    }, step);

    return () => clearInterval(timer);
  }, []);

  if (phase === 'done') return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[9999] bg-[#131316] flex items-center justify-center select-none transition-transform duration-[600ms] ease-[cubic-bezier(0.76,0,0.24,1)] ${
        phase === 'exiting' ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      {/* Center content */}
      <div className="flex flex-col items-center gap-8">
        {/* Animated brand mark */}
        <div className="relative">
          {/* Ambient glow behind */}
          
          {/* Brand wordmark */}
          <h1
            className="relative font-headline-lg text-5xl sm:text-7xl text-primary tracking-tight transition-all duration-700 ease-out"
            style={{
              opacity: Math.min(progress / 40, 1),
              transform: `scale(${0.9 + Math.min(progress / 1000, 0.1)})`,
            }}
          >
            Cadence
          </h1>
        </div>

        {/* Progress line */}
        <div className="w-48 sm:w-64 h-px bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, rgba(136,39,15,0.8), #ffb4a3)',
              boxShadow: '0 0 12px rgba(255,180,163,0.4)',
              transition: 'width 60ms linear',
            }}
          />
        </div>
      </div>
    </div>
  );
}
