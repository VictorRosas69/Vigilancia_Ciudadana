import { useState, useRef, useEffect } from 'react';

const LazyImage = ({ src, alt, className, style, imgClassName }) => {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className || ''}`} style={style}>
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${loaded ? 'opacity-0' : 'opacity-100'}`}
        aria-hidden="true"
        style={{
          background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 37%, #f1f5f9 63%)',
          backgroundSize: '400% 100%',
          animation: loaded ? 'none' : 'imgShimmer 1.4s ease infinite',
        }}
      />
      {inView && (
        <img
          src={src}
          alt={alt || ''}
          className={`w-full h-full object-cover transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'} ${imgClassName || ''}`}
          onLoad={() => setLoaded(true)}
        />
      )}
    </div>
  );
};

export default LazyImage;
