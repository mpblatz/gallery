import { useEffect } from 'react';
import { useIntersection } from '../hooks/useIntersection';
import { LoadingSpinner } from './LoadingSpinner';

interface Props {
  onVisible: () => void;
  hasMore: boolean;
  loading: boolean;
}

export function SentinelLoader({ onVisible, hasMore, loading }: Props) {
  const { ref, isIntersecting } = useIntersection({ rootMargin: '200px' });

  useEffect(() => {
    if (isIntersecting && hasMore && !loading) {
      onVisible();
    }
  }, [isIntersecting, hasMore, loading, onVisible]);

  return (
    <div ref={ref} className="py-4">
      {loading && <LoadingSpinner />}
    </div>
  );
}
