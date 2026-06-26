import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './ImageCarousel.module.scss';

/*
 * Premium property-style gallery: fixed/limited height with object-fit cover,
 * left/right arrows, swipe on touch, a "1 / N" photo count, dots, and a
 * full-screen lightbox on click (with arrows, swipe and Esc). When there are
 * no photos it renders a clean placeholder, so callers can always render it.
 */
const FALLBACK_PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

export default function ImageCarousel({ photos = [], placeholderLabel = 'No photos yet' }) {
  const normalised = (photos || [])
    .map((p) => {
      if (typeof p === 'string') return { src: p };
      if (p && typeof p === 'object') return { src: p.url || p.path || p.src || '' };
      return { src: '' };
    })
    .filter((p) => p.src);

  const total = normalised.length;
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const startXRef = useRef(null);

  const go = useCallback(
    (dir) => setIndex((prev) => (prev + dir + total) % total),
    [total]
  );
  const next = useCallback(() => go(1), [go]);
  const prev = useCallback(() => go(-1), [go]);

  const onTouchStart = (e) => {
    if (e.touches && e.touches[0]) startXRef.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (startXRef.current == null || !e.changedTouches?.[0]) return;
    const diff = e.changedTouches[0].clientX - startXRef.current;
    if (diff > 50) prev();
    else if (diff < -50) next();
    startXRef.current = null;
  };

  // Lightbox: lock scroll + keyboard nav
  useEffect(() => {
    if (!lightbox) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setLightbox(false);
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightbox, next, prev]);

  // Empty → placeholder
  if (!total) {
    return (
      <div className={`${styles.gallery} ${styles.placeholder}`}>
        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
        <span>{placeholderLabel}</span>
      </div>
    );
  }

  const current = normalised[index] || {};
  const Arrows = total > 1 && (
    <>
      <button type="button" className={`${styles.nav} ${styles.prev}`} onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Previous photo">‹</button>
      <button type="button" className={`${styles.nav} ${styles.next}`} onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Next photo">›</button>
    </>
  );

  return (
    <>
      <div className={styles.gallery}>
        <div
          className={styles.frame}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onClick={() => setLightbox(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setLightbox(true)}
          aria-label="Open full-screen photo"
        >
          <img
            src={current.src || FALLBACK_PIXEL}
            alt={total > 1 ? `Photo ${index + 1} of ${total}` : 'Photo'}
            className={styles.img}
            loading="lazy"
          />
          {Arrows}
          <span className={styles.count} aria-hidden="true">
            {index + 1} / {total} {total === 1 ? 'photo' : 'photos'}
          </span>
          <span className={styles.expandHint} aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          </span>
        </div>

        {total > 1 && (
          <div className={styles.dots}>
            {normalised.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`${styles.dot} ${i === index ? styles.active : ''}`}
                onClick={() => setIndex(i)}
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {lightbox &&
        createPortal(
          <div className={styles.lightbox} onClick={() => setLightbox(false)} role="dialog" aria-modal="true" aria-label="Photo viewer">
            <button type="button" className={styles.lbClose} onClick={() => setLightbox(false)} aria-label="Close">✕</button>
            <div className={styles.lbStage} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
              <img src={current.src || FALLBACK_PIXEL} alt={`Photo ${index + 1} of ${total}`} className={styles.lbImg} onClick={(e) => e.stopPropagation()} />
              {total > 1 && (
                <>
                  <button type="button" className={`${styles.lbNav} ${styles.prev}`} onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Previous photo">‹</button>
                  <button type="button" className={`${styles.lbNav} ${styles.next}`} onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Next photo">›</button>
                </>
              )}
            </div>
            <div className={styles.lbCount}>{index + 1} / {total}</div>
          </div>,
          document.body
        )}
    </>
  );
}
