/**
 * AnimatedBackground Component
 * 
 * Renders modern animated backgrounds for the application.
 * Supports multiple styles: aurora, blobs, grid, or combined.
 * Automatically respects theme and reduced motion preferences.
 * 
 * Usage:
 * <AnimatedBackground type="aurora" />
 * <AnimatedBackground type="blobs" parallax />
 * <AnimatedBackground type="combined" />
 */

import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const AnimatedBackground = ({ 
  type = 'aurora', 
  parallax = false,
  className = '' 
}) => {
  const bgRef = useRef(null);

  useEffect(() => {
    if (!parallax || !bgRef.current) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Parallax effect on scroll
    const handleScroll = () => {
      if (!bgRef.current) return;
      
      const scrollY = window.scrollY;
      const blobs = bgRef.current.querySelectorAll('.blob');
      
      blobs.forEach((blob, index) => {
        const speed = 0.05 + (index * 0.02);
        const yOffset = scrollY * speed;
        blob.style.transform = `translateY(${yOffset}px)`;
      });
    };

    // Throttle scroll handler for performance
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', throttledScroll);
    };
  }, [parallax]);

  const renderAurora = () => (
    <div className={`bg-aurora ${className}`} ref={bgRef} aria-hidden="true">
      <div className="noise" />
    </div>
  );

  const renderBlobs = () => (
    <div 
      className={`bg-blobs ${className}`} 
      ref={bgRef}
      data-parallax={parallax}
      aria-hidden="true"
    >
      <div className="blob" />
      <div className="blob" />
      <div className="blob" />
    </div>
  );

  const renderGrid = () => (
    <div className={`bg-grid ${className}`} ref={bgRef} aria-hidden="true" />
  );

  const renderCombined = () => (
    <div className={`bg-combined ${className}`} ref={bgRef} aria-hidden="true">
      <div className="aurora-layer" />
      <div className="blob-layer" />
      <div className="blob-layer" />
    </div>
  );

  switch (type) {
    case 'blobs':
      return renderBlobs();
    case 'grid':
      return renderGrid();
    case 'combined':
      return renderCombined();
    case 'aurora':
    default:
      return renderAurora();
  }
};

AnimatedBackground.propTypes = {
  type: PropTypes.oneOf(['aurora', 'blobs', 'grid', 'combined']),
  parallax: PropTypes.bool,
  className: PropTypes.string,
};

export default AnimatedBackground;
