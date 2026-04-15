import { useState, useRef, useEffect } from 'react';
import type { Artwork } from '../types/artwork';
import { useCollections } from '../hooks/useCollections';

interface Props {
  artwork: Artwork;
  onClose: () => void;
}

export function GalleryPicker({ artwork, onClose }: Props) {
  const { galleries, isInGallery, addToGallery, removeFromGallery, createGallery } = useCollections();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const id = setTimeout(() => document.addEventListener('click', handler), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('click', handler);
    };
  }, [onClose]);

  useEffect(() => {
    if (creating && inputRef.current) inputRef.current.focus();
  }, [creating]);

  const handleToggle = (galleryId: string) => {
    if (isInGallery(galleryId, artwork)) {
      removeFromGallery(galleryId, artwork);
    } else {
      addToGallery(galleryId, artwork);
    }
  };

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const gallery = await createGallery(trimmed);
    addToGallery(gallery.id, artwork);
    setNewName('');
    setCreating(false);
  };

  return (
    <div
      ref={ref}
      className="rounded-xl p-1.5 min-w-[180px]"
      style={{
        background: 'rgba(17, 17, 17, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-2 pt-1 pb-1.5 text-[9px] font-semibold tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
        Add to Gallery
      </div>

      {galleries.length === 0 && !creating && (
        <div className="px-2 py-1.5 text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
          No galleries yet
        </div>
      )}

      {galleries.map((g) => {
        const inGallery = isInGallery(g.id, artwork);
        return (
          <button
            key={g.id}
            onClick={() => handleToggle(g.id)}
            className="w-full text-left px-2 py-1.5 text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-2"
            style={{ color: 'rgba(255,255,255,0.6)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
          >
            <span
              className="w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 text-[10px]"
              style={{
                border: inGallery ? 'none' : '1px solid rgba(255,255,255,0.2)',
                background: inGallery ? 'var(--accent, #6d9fff)' : 'transparent',
                color: inGallery ? '#fff' : 'transparent',
              }}
            >
              {inGallery && '✓'}
            </span>
            <span className="truncate">{g.name}</span>
          </button>
        );
      })}

      {creating ? (
        <div className="px-1 py-1">
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
          className="w-full text-left px-2 py-1.5 text-[11px] rounded-lg transition-colors cursor-pointer"
          style={{ color: 'var(--accent, #6d9fff)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          + New Gallery
        </button>
      )}
    </div>
  );
}
