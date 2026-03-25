import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Detecta un deslizamiento desde el borde izquierdo (≤30px) hacia la derecha
 * para navegar hacia atrás, como en apps nativas iOS.
 */
const useSwipeBack = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let isEdgeSwipe = false;

    const onTouchStart = (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isEdgeSwipe = startX <= 30;
    };

    const onTouchEnd = (e) => {
      if (!isEdgeSwipe) return;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = Math.abs(e.changedTouches[0].clientY - startY);
      if (dx > 80 && dy < 80) {
        navigator.vibrate?.(8);
        navigate(-1);
      }
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [navigate]);
};

export default useSwipeBack;
