import { useRef, useCallback } from 'react';
import { yearToFraction, fractionToYear } from '../../hooks/useTimeMachine';

const TICK_YEARS = [-3000, 0, 500, 1000, 1400, 1600, 1800, 1900, 1950, 2000];

interface Props {
  year: number;
  onChange: (year: number) => void;
}

export function Timeline({ year, onChange }: Props) {
  const barRef = useRef<HTMLDivElement>(null);

  const fractionFromEvent = useCallback((clientX: number): number => {
    const bar = barRef.current;
    if (!bar) return 0;
    const rect = bar.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    const frac = fractionFromEvent(e.clientX);
    onChange(fractionToYear(frac));
  }, [fractionFromEvent, onChange]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const frac = fractionFromEvent(e.clientX);
    onChange(fractionToYear(frac));
  }, [fractionFromEvent, onChange]);

  const fraction = yearToFraction(year);
  const displayYear = year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;

  return (
    <div style={{ padding: '16px 0' }}>
      {/* Year display */}
      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', lineHeight: 1 }}>
          {displayYear}
        </span>
      </div>

      {/* Bar */}
      <div
        ref={barRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        style={{
          position: 'relative',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        {/* Track line */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '2px',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '1px',
          }}
        />

        {/* Filled portion */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            width: `${fraction * 100}%`,
            height: '2px',
            background: 'rgba(255,255,255,0.5)',
            borderRadius: '1px',
          }}
        />

        {/* Indicator */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: `${fraction * 100}%`,
            transform: 'translate(-50%, -50%)',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 0 8px rgba(255,255,255,0.3)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Tick marks */}
      <div style={{ position: 'relative', height: '24px', marginTop: '4px' }}>
        {TICK_YEARS.map((ty) => {
          const frac = yearToFraction(ty);
          return (
            <span
              key={ty}
              style={{
                position: 'absolute',
                left: `${frac * 100}%`,
                transform: 'translateX(-50%)',
                fontSize: '0.6rem',
                color: 'rgba(255,255,255,0.2)',
                whiteSpace: 'nowrap',
              }}
            >
              {ty < 0 ? `${Math.abs(ty)}BC` : ty}
            </span>
          );
        })}
      </div>
    </div>
  );
}
