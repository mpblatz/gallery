import { useState } from 'react';
import { hexToHsl, hslToHex, isValidHex, normalizeHex } from '../../lib/colorUtils';

interface Props {
  hue: number;
  onHueChange: (h: number) => void;
}

export function HexInput({ hue, onHueChange }: Props) {
  const [input, setInput] = useState('');
  const [invalid, setInvalid] = useState(false);

  const currentHex = hslToHex(hue, 100, 50);

  const handleSubmit = () => {
    if (!input.trim()) return;
    if (isValidHex(input)) {
      const normalized = normalizeHex(input);
      const { h } = hexToHsl(normalized);
      onHueChange(h);
      setInput('');
      setInvalid(false);
    } else {
      setInvalid(true);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <label className="text-[11px] font-medium shrink-0" style={{ color: 'var(--text-faint)' }}>
        Or enter hex:
      </label>
      <div
        className="shrink-0"
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '6px',
          border: '1px solid var(--border)',
          backgroundColor: currentHex,
        }}
        title={currentHex}
      />
      <input
        type="text"
        value={input}
        onChange={(e) => { setInput(e.target.value); setInvalid(false); }}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
        placeholder="#FF5733"
        className="text-xs focus:outline-none"
        style={{
          width: '100px',
          padding: '6px 10px',
          borderRadius: '8px',
          border: `1px solid ${invalid ? '#fca5a5' : 'var(--border)'}`,
          color: 'var(--text)',
          background: 'var(--card-bg)',
        }}
      />
      <button
        onClick={handleSubmit}
        className="shrink-0 text-xs font-semibold transition-colors cursor-pointer"
        style={{
          padding: '6px 14px',
          borderRadius: '8px',
          background: 'var(--accent)',
          color: '#fff',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-hover)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
      >
        Apply
      </button>
    </div>
  );
}
