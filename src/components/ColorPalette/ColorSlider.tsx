import { hslToHex } from '../../lib/colorUtils';

interface Props {
  value: number;
  onChange: (v: number) => void;
  hue: number;
}

export function ColorSlider({ value, onChange, hue }: Props) {
  const vividColor = hslToHex(hue, 100, 50);

  return (
    <div className="w-full">
      <label className="text-[11px] font-medium mb-1 block" style={{ color: 'var(--text-faint)' }}>
        Vibrancy filter
        <span className="font-normal" style={{ color: 'var(--text-very-faint)' }}> — slide right to show only colorful artworks</span>
      </label>
      <input
        type="range"
        min={0}
        max={80}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer"
        style={{
          background: `linear-gradient(to right, #d4d4d4 0%, ${vividColor} 100%)`,
        }}
      />
      <div className="flex justify-between mt-0.5" style={{ fontSize: '10px', color: 'var(--text-very-faint)' }}>
        <span>All artworks</span>
        <span>Only vivid colors</span>
      </div>
    </div>
  );
}
