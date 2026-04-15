import { useState, useRef, useEffect } from 'react';
import type { MuseumId, ArtType } from '../types/artwork';
import { museumOptions } from '../lib/museums/registry';
import { Timeline } from './TimeMachine/Timeline';
import { ColorWheel } from './ColorPalette/ColorWheel';
import { hslToHex } from '../lib/colorUtils';

const ART_TYPES: { id: ArtType; label: string }[] = [
  { id: 'all', label: 'All Types' },
  { id: 'painting', label: 'Painting' },
  { id: 'sculpture', label: 'Sculpture' },
  { id: 'photograph', label: 'Photography' },
  { id: 'print', label: 'Print' },
  { id: 'drawing', label: 'Drawing' },
  { id: 'textile', label: 'Textile' },
  { id: 'ceramic', label: 'Ceramic' },
];

interface Props {
  museum: MuseumId | 'all';
  onMuseumChange: (m: MuseumId | 'all') => void;
  artType: ArtType;
  onArtTypeChange: (t: ArtType) => void;
  year: number | null;
  onYearChange: (y: number | null) => void;
  colorHue: number | null;
  onColorHueChange: (h: number | null) => void;
  publicDomain: boolean;
  onPublicDomainChange: (v: boolean) => void;
  keywords: string;
  onKeywordsChange: (k: string) => void;
}

type ExpandedPanel = 'none' | 'museum' | 'type' | 'time' | 'color';

export function FilterBar({
  museum, onMuseumChange,
  artType, onArtTypeChange,
  year, onYearChange,
  colorHue, onColorHueChange,
  publicDomain, onPublicDomainChange,
  keywords, onKeywordsChange,
}: Props) {
  const [expanded, setExpanded] = useState<ExpandedPanel>('none');
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (expanded === 'none') return;
    const handler = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setExpanded('none');
      }
    };
    const id = setTimeout(() => document.addEventListener('click', handler), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('click', handler);
    };
  }, [expanded]);

  const toggle = (panel: ExpandedPanel) => {
    setExpanded((prev) => (prev === panel ? 'none' : panel));
  };

  const museumLabel = museumOptions.find((m) => m.id === museum)?.name || 'All Museums';
  const typeLabel = ART_TYPES.find((t) => t.id === artType)?.label || 'All Types';

  const colorActiveHex = colorHue !== null ? hslToHex(colorHue, 60, 30) : undefined;

  const panelStyle: React.CSSProperties = {
    background: 'rgba(17, 17, 17, 0.9)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40" ref={barRef}>
      {/* Bar */}
      <div
        className="flex items-center gap-0.5 rounded-2xl px-1.5 py-1.5"
        style={{
          background: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Search input */}
        <div className="relative flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 absolute left-2.5 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="rgba(255,255,255,0.35)">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={keywords}
            onChange={(e) => onKeywordsChange(e.target.value)}
            placeholder="Search..."
            className="text-[11px] font-medium rounded-xl py-1.5 pl-7 pr-6 outline-none w-28 focus:w-40 transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: '#fff',
              border: 'none',
            }}
          />
          {keywords && (
            <button
              onClick={() => onKeywordsChange('')}
              className="absolute right-1.5 cursor-pointer"
              style={{ color: 'rgba(255,255,255,0.4)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
            >
              <span className="text-[13px]">&times;</span>
            </button>
          )}
        </div>

        <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)' }} />

        {/* Museum dropdown trigger */}
        <button
          onClick={() => toggle('museum')}
          className="px-3 py-1.5 text-[11px] font-medium rounded-xl transition-all cursor-pointer whitespace-nowrap"
          style={{
            color: museum !== 'all' ? '#fff' : 'rgba(255,255,255,0.6)',
          }}
        >
          {museum === 'all' ? 'All Museums' : museumLabel} <span style={{ opacity: 0.4 }}>&#9662;</span>
        </button>

        <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)' }} />

        {/* Art type dropdown trigger */}
        <button
          onClick={() => toggle('type')}
          className="px-3 py-1.5 text-[11px] font-medium rounded-xl transition-all cursor-pointer whitespace-nowrap"
          style={{
            color: artType !== 'all' ? '#fff' : 'rgba(255,255,255,0.6)',
          }}
        >
          {typeLabel} <span style={{ opacity: 0.4 }}>&#9662;</span>
        </button>

        <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)' }} />

        {/* Time toggle */}
        <button
          onClick={() => {
            if (year !== null && expanded !== 'time') {
              toggle('time');
            } else if (year !== null) {
              onYearChange(null);
              setExpanded('none');
            } else {
              onYearChange(1875);
              toggle('time');
            }
          }}
          className="px-3 py-1.5 text-[11px] font-medium rounded-xl transition-all cursor-pointer whitespace-nowrap"
          style={{
            background: year !== null ? 'rgba(255,255,255,0.15)' : 'transparent',
            color: year !== null ? '#fff' : 'rgba(255,255,255,0.6)',
          }}
        >
          Time {year !== null && <span className="ml-1 text-[13px] opacity-60">&times;</span>}
        </button>

        <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)' }} />

        {/* Color toggle */}
        <button
          onClick={() => {
            if (colorHue !== null && expanded !== 'color') {
              toggle('color');
            } else if (colorHue !== null) {
              onColorHueChange(null);
              setExpanded('none');
            } else {
              onColorHueChange(0);
              toggle('color');
            }
          }}
          className="px-3 py-1.5 text-[11px] font-medium rounded-xl transition-all cursor-pointer whitespace-nowrap"
          style={{
            background: colorActiveHex || 'transparent',
            color: colorHue !== null ? '#fff' : 'rgba(255,255,255,0.6)',
          }}
        >
          Color {colorHue !== null && <span className="ml-1 text-[13px] opacity-60">&times;</span>}
        </button>

        <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)' }} />

        {/* Public Domain toggle */}
        <button
          onClick={() => onPublicDomainChange(!publicDomain)}
          className="px-3 py-1.5 text-[11px] font-medium rounded-xl transition-all cursor-pointer whitespace-nowrap"
          style={{
            background: publicDomain ? 'rgba(255,255,255,0.15)' : 'transparent',
            color: publicDomain ? '#fff' : 'rgba(255,255,255,0.6)',
          }}
        >
          Public Domain {publicDomain && <span className="ml-1 text-[13px] opacity-60">&times;</span>}
        </button>
      </div>

      {/* Expanded panels */}
      <div
        className="mt-2 overflow-hidden transition-all duration-200"
        style={{
          maxHeight: expanded !== 'none' ? '400px' : '0',
          opacity: expanded !== 'none' ? 1 : 0,
          pointerEvents: expanded !== 'none' ? 'auto' : 'none',
        }}
      >
        <div className="rounded-2xl p-3" style={panelStyle}>
          {/* Museum list */}
          {expanded === 'museum' && (
            <div className="space-y-0.5">
              {museumOptions.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { onMuseumChange(m.id); setExpanded('none'); }}
                  className="w-full text-left px-3 py-2 text-[11px] rounded-lg transition-colors cursor-pointer"
                  style={{
                    background: museum === m.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: museum === m.id ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}

          {/* Art type list */}
          {expanded === 'type' && (
            <div className="space-y-0.5">
              {ART_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { onArtTypeChange(t.id); setExpanded('none'); }}
                  className="w-full text-left px-3 py-2 text-[11px] rounded-lg transition-colors cursor-pointer"
                  style={{
                    background: artType === t.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: artType === t.id ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {/* Time controls */}
          {expanded === 'time' && (
            <div>
              <Timeline year={year ?? 1875} onChange={onYearChange} />
            </div>
          )}

          {/* Color controls */}
          {expanded === 'color' && (
            <div>
              <ColorWheel hue={colorHue ?? 0} onHueChange={onColorHueChange} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
