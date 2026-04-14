import { useCallback, useRef } from 'react';
import { hslToHex } from '../../lib/colorUtils';

interface Props {
  hue: number;
  onHueChange: (h: number) => void;
}

const SPECTRUM = [
  '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ff0000',
].map((c, i) => `${c} ${(i / 6) * 100}%`).join(', ');

export function ColorWheel({ hue, onHueChange }: Props) {
  const barRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updateHue = useCallback((clientX: number) => {
    const bar = barRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onHueChange(Math.round(fraction * 360));
  }, [onHueChange]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateHue(e.clientX);
  }, [updateHue]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    updateHue(e.clientX);
  }, [updateHue]);

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return (
    <div style={{ width: '100%' }}>
      <div
        ref={barRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          position: 'relative',
          height: '32px',
          borderRadius: '8px',
          cursor: 'crosshair',
          touchAction: 'none',
          userSelect: 'none',
          background: `linear-gradient(to right, ${SPECTRUM})`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: `${(hue / 360) * 100}%`,
            transform: 'translate(-50%, -50%)',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            border: '3px solid white',
            backgroundColor: hslToHex(hue, 100, 50),
            boxShadow: '0 0 0 1px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.4)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}
