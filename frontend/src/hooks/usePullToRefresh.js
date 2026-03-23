import { useState, useEffect, useRef, useCallback } from 'react';

const THRESHOLD = 72;  // px to pull before triggering refresh
const MAX_PULL  = 110; // max visual stretch

const usePullToRefresh = (onRefresh) => {
  const [pullY, setPullY]         = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY  = useRef(null);
  const pulling = useRef(false);

  const onTouchStart = useCallback((e) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const onTouchMove = useCallback((e) => {
    if (startY.current === null) return;
    if (window.scrollY > 0) { startY.current = null; return; }
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) {
      pulling.current = true;
      // ease-out: el tirón se siente más natural con resistencia
      setPullY(Math.min(MAX_PULL, dy * 0.5));
    }
  }, []);

  const onTouchEnd = useCallback(async () => {
    const dist = pullY;
    if (pulling.current && dist >= THRESHOLD) {
      setPullY(0);
      setRefreshing(true);
      try { await onRefresh(); } finally { setRefreshing(false); }
    } else {
      setPullY(0);
    }
    pulling.current = false;
    startY.current  = null;
  }, [pullY, onRefresh]);

  useEffect(() => {
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove',  onTouchMove,  { passive: true });
    document.addEventListener('touchend',   onTouchEnd,   { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove',  onTouchMove);
      document.removeEventListener('touchend',   onTouchEnd);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd]);

  return { pullY, refreshing };
};

export default usePullToRefresh;
