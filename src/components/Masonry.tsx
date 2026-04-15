import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';

interface Props {
  children: ReactNode[];
  gap?: number;
}

function getColumnCount(width: number): number {
  if (width >= 1536) return 6;
  if (width >= 1280) return 5;
  if (width >= 1024) return 4;
  if (width >= 640) return 3;
  return 2;
}

interface ItemPosition {
  left: number;
  top: number;
  width: number;
}

export function Masonry({ children, gap = 8 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<ItemPosition[]>([]);
  const [containerHeight, setContainerHeight] = useState(0);
  const columnHeightsRef = useRef<number[]>([]);
  const prevCountRef = useRef(0);
  const prevColsRef = useRef(0);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const layout = useCallback((fullRelayout = false) => {
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.offsetWidth;
    const cols = getColumnCount(containerWidth);
    const colWidth = (containerWidth - gap * (cols - 1)) / cols;
    const count = children.length;

    // Full relayout if column count changed or items were removed (filter/search)
    const needsFullRelayout = fullRelayout || cols !== prevColsRef.current || count < prevCountRef.current;

    let colHeights: number[];
    let startIndex: number;
    let newPositions: ItemPosition[];

    if (needsFullRelayout) {
      colHeights = new Array(cols).fill(0);
      startIndex = 0;
      newPositions = [];
    } else {
      colHeights = [...columnHeightsRef.current];
      // Ensure colHeights has the right length
      while (colHeights.length < cols) colHeights.push(0);
      startIndex = prevCountRef.current;
      newPositions = [...positions.slice(0, startIndex)];
    }

    for (let i = startIndex; i < count; i++) {
      const shortestCol = colHeights.indexOf(Math.min(...colHeights));
      const left = shortestCol * (colWidth + gap);
      const top = colHeights[shortestCol];

      newPositions.push({ left, top, width: colWidth });

      // Measure actual height of the item
      const el = itemRefs.current.get(i);
      const height = el ? el.offsetHeight : 0;
      colHeights[shortestCol] += height + gap;
    }

    columnHeightsRef.current = colHeights;
    prevCountRef.current = count;
    prevColsRef.current = cols;
    setPositions(newPositions);
    setContainerHeight(Math.max(...colHeights));
  }, [children.length, gap, positions]);

  // Relayout on resize (column count changes)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      layout(true);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [layout]);

  // Layout when new children arrive or children are replaced
  useEffect(() => {
    // Use a short RAF to let items render first so we can measure them
    const id = requestAnimationFrame(() => {
      const cols = containerRef.current ? getColumnCount(containerRef.current.offsetWidth) : 0;
      const needsFull = cols !== prevColsRef.current || children.length < prevCountRef.current;
      layout(needsFull);
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children.length]);

  // Re-measure when images load (heights change)
  const handleImageLoad = useCallback(() => {
    layout(true);
  }, [layout]);

  // Listen for image loads within the container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('load', handleImageLoad, true);
    return () => container.removeEventListener('load', handleImageLoad, true);
  }, [handleImageLoad]);

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: containerHeight, padding: gap }}
    >
      {children.map((child, i) => {
        const pos = positions[i];
        return (
          <div
            key={i}
            ref={(el) => {
              if (el) itemRefs.current.set(i, el);
              else itemRefs.current.delete(i);
            }}
            style={{
              position: 'absolute',
              left: pos ? pos.left + gap : 0,
              top: pos ? pos.top : 0,
              width: pos ? pos.width : '100%',
              visibility: pos ? 'visible' : 'hidden',
            }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}
