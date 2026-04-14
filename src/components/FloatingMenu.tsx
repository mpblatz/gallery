import { useState, useRef, useEffect } from 'react';
import { Timeline } from './TimeMachine/Timeline';
import { ColorWheel } from './ColorPalette/ColorWheel';

type FilterMode = 'none' | 'time' | 'color';

interface Props {
  filterMode: FilterMode;
  onFilterModeChange: (mode: FilterMode) => void;
  year: number;
  onYearChange: (year: number) => void;
  hue: number;
  onHueChange: (hue: number) => void;
}

export function FloatingMenu({
  filterMode,
  onFilterModeChange,
  year,
  onYearChange,
  hue,
  onHueChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    // Delay to prevent the opening click from immediately closing
    const id = setTimeout(() => document.addEventListener('click', handleClick), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('click', handleClick);
    };
  }, [open]);

  return (
    <div className="fixed top-5 right-5 z-40" ref={panelRef}>
      {/* Panel */}
      <div
        className="absolute top-14 right-0 overflow-hidden transition-all duration-200"
        style={{
          width: '320px',
          maxHeight: open ? '500px' : '0',
          opacity: open ? 1 : 0,
          background: 'rgba(17, 17, 17, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        <div className="p-4 space-y-4">
          {/* Filter mode tabs */}
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
            {(['time', 'color'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => onFilterModeChange(filterMode === mode ? 'none' : mode)}
                className="flex-1 px-3 py-1.5 text-[11px] font-medium rounded-md transition-all cursor-pointer"
                style={{
                  background: filterMode === mode ? 'var(--accent)' : 'transparent',
                  color: filterMode === mode ? '#fff' : 'var(--text-muted)',
                }}
              >
                {mode === 'time' ? 'Time' : 'Color'}
              </button>
            ))}
          </div>

          {/* Time controls */}
          {filterMode === 'time' && (
            <div>
              <Timeline year={year} onChange={onYearChange} />
            </div>
          )}

          {/* Color controls */}
          {filterMode === 'color' && (
            <div>
              <ColorWheel hue={hue} onHueChange={onHueChange} />
            </div>
          )}

          {/* No filter message */}
          {filterMode === 'none' && (
            <p className="text-[11px] text-center py-2" style={{ color: 'var(--text-faint)' }}>
              Select a filter to explore art by time period or color
            </p>
          )}

          {/* Clear button */}
          {filterMode !== 'none' && (
            <button
              onClick={() => onFilterModeChange('none')}
              className="w-full py-1.5 text-[11px] font-medium rounded-md transition-colors cursor-pointer"
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-muted)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer"
        style={{
          background: open ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          color: open ? '#fff' : 'var(--text-muted)',
        }}
        onMouseEnter={(e) => {
          if (!open) e.currentTarget.style.background = 'rgba(255,255,255,0.18)';
        }}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
        }}
        aria-label="Toggle menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 transition-transform duration-200"
          style={{ transform: open ? 'rotate(45deg)' : 'none' }}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    </div>
  );
}
