import { useState, useRef, useEffect } from 'react';
import { useCollections } from '../hooks/useCollections';

export type AppView =
  | { kind: 'feed' }
  | { kind: 'favorites' }
  | { kind: 'gallery'; galleryId: string };

interface Props {
  onSurprise: () => void;
  surpriseLoading: boolean;
  onQuiz: () => void;
  view: AppView;
  onViewChange: (view: AppView) => void;
}

export function AppMenu({ onSurprise, surpriseLoading, onQuiz, view, onViewChange }: Props) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { favorites, galleries, createGallery } = useCollections();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
      }
    };
    const id = setTimeout(() => document.addEventListener('click', handler), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('click', handler);
    };
  }, [open]);

  useEffect(() => {
    if (creating && inputRef.current) inputRef.current.focus();
  }, [creating]);

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const gallery = await createGallery(trimmed);
    setNewName('');
    setCreating(false);
    setOpen(false);
    onViewChange({ kind: 'gallery', galleryId: gallery.id });
  };

  const menuItemStyle: React.CSSProperties = {
    color: 'rgba(255,255,255,0.6)',
  };

  return (
    <div className="fixed top-5 right-5 z-40" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="px-3 py-1.5 text-[11px] font-medium rounded-xl transition-all cursor-pointer"
        style={{
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.06)',
          color: open ? '#fff' : 'rgba(255,255,255,0.6)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      <div
        className="absolute right-0 mt-2 w-56 overflow-hidden transition-all duration-200"
        style={{
          maxHeight: open ? '500px' : '0',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        <div
          className="rounded-2xl p-2"
          style={{
            background: 'rgba(17, 17, 17, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          {/* Surprise Me */}
          <button
            onClick={() => { onSurprise(); setOpen(false); }}
            disabled={surpriseLoading}
            className="w-full text-left px-3 py-2 text-[11px] rounded-lg transition-colors cursor-pointer"
            style={menuItemStyle}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
          >
            {surpriseLoading ? '...' : 'Surprise Me'}
          </button>

          {/* Quiz */}
          <button
            onClick={() => { onQuiz(); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-[11px] rounded-lg transition-colors cursor-pointer"
            style={menuItemStyle}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
          >
            Quiz
          </button>

          {/* Divider */}
          <div className="my-1.5 mx-2" style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />

          {/* Back to Feed (when viewing a gallery) */}
          {view.kind !== 'feed' && (
            <button
              onClick={() => { onViewChange({ kind: 'feed' }); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-[11px] rounded-lg transition-colors cursor-pointer"
              style={menuItemStyle}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
            >
              Back to Feed
            </button>
          )}

          {/* Favorites */}
          <button
            onClick={() => { onViewChange({ kind: 'favorites' }); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-[11px] rounded-lg transition-colors cursor-pointer flex items-center justify-between"
            style={{
              ...menuItemStyle,
              ...(view.kind === 'favorites' ? { background: 'rgba(255,255,255,0.08)', color: '#fff' } : {}),
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => {
              if (view.kind !== 'favorites') {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
              }
            }}
          >
            <span className="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              Favorites
            </span>
            {favorites.size > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                {favorites.size}
              </span>
            )}
          </button>

          {/* Galleries */}
          {galleries.length > 0 && (
            <>
              <div className="px-3 pt-2 pb-1 text-[9px] font-semibold tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Galleries
              </div>
              {galleries.map((g) => (
                <button
                  key={g.id}
                  onClick={() => { onViewChange({ kind: 'gallery', galleryId: g.id }); setOpen(false); }}
                  className="w-full text-left px-3 py-2 text-[11px] rounded-lg transition-colors cursor-pointer flex items-center justify-between"
                  style={{
                    ...menuItemStyle,
                    ...(view.kind === 'gallery' && view.galleryId === g.id
                      ? { background: 'rgba(255,255,255,0.08)', color: '#fff' }
                      : {}),
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={(e) => {
                    if (!(view.kind === 'gallery' && view.galleryId === g.id)) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                    }
                  }}
                >
                  <span className="truncate">{g.name}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    {g.artworkKeys.length}
                  </span>
                </button>
              ))}
            </>
          )}

          {/* Create Gallery */}
          {creating ? (
            <div className="px-2 py-1.5">
              <input
                ref={inputRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape') { setCreating(false); setNewName(''); }
                }}
                placeholder="Gallery name..."
                className="w-full px-2 py-1.5 text-[11px] rounded-lg outline-none"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff',
                }}
              />
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="w-full text-left px-3 py-2 text-[11px] rounded-lg transition-colors cursor-pointer"
              style={{ color: 'var(--accent, #6d9fff)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              + New Gallery
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
