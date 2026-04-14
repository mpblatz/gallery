import { useState } from 'react';

interface Props {
  colors: string[];
}

type Format = 'css' | 'tailwind' | 'hex';

function formatPalette(colors: string[], format: Format): string {
  switch (format) {
    case 'css':
      return colors.map((c, i) => `--palette-${i + 1}: ${c};`).join('\n');
    case 'tailwind':
      return `colors: {\n  palette: {\n${colors.map((c, i) => `    ${i + 1}: '${c}',`).join('\n')}\n  }\n}`;
    case 'hex':
      return colors.join('\n');
  }
}

export function PaletteExport({ colors }: Props) {
  const [copied, setCopied] = useState<Format | null>(null);

  const copy = async (format: Format) => {
    const text = formatPalette(colors, format);
    await navigator.clipboard.writeText(text);
    setCopied(format);
    setTimeout(() => setCopied(null), 2000);
  };

  if (colors.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <CopyButton label="CSS Variables" active={copied === 'css'} onClick={() => copy('css')} />
      <CopyButton label="Tailwind Config" active={copied === 'tailwind'} onClick={() => copy('tailwind')} />
      <CopyButton label="Hex List" active={copied === 'hex'} onClick={() => copy('hex')} />
    </div>
  );
}

function CopyButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-[11px] font-medium transition-colors cursor-pointer"
      style={{
        padding: '5px 12px',
        borderRadius: '8px',
        background: active ? 'var(--accent-tint)' : 'var(--card-bg)',
        color: active ? 'var(--accent)' : 'var(--text-muted)',
        border: `1px solid ${active ? 'var(--accent-tint-border)' : 'var(--border)'}`,
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.borderColor = 'var(--border-hover)';
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      {active ? 'Copied!' : label}
    </button>
  );
}
