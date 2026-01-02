import React, { useState, useRef } from 'react';
import styles from './ImageCarousel.module.scss';

/*
 * A simple image carousel component with next/previous arrows and swipe support.
 * It accepts an array of photo objects or strings. Each item can either be a
 * URL string or an object with a `url` or `path` property. If there is only one
 * photo the navigation controls are hidden. On touch devices swiping left
 * or right will move between images. Dots below the carousel indicate
 * which image is currently active and allow direct selection.
 */
export default function ImageCarousel({ photos = [] }) {
  // Normalise the input into a uniform array of objects with a `src` field
  const normalised = photos.map((p) => {
    if (typeof p === 'string') return { src: p };
    if (p && typeof p === 'object') {
      return { src: p.url || p.path || '' };
    }
    return { src: '' };
  });
  const total = normalised.length;
  const [index, setIndex] = useState(0);

  // Navigate to the next image, wrapping around at the end
  const next = () => {
    setIndex((prev) => (prev + 1) % total);
  };

  // Navigate to the previous image, wrapping around at the beginning
  const prev = () => {
    setIndex((prev) => (prev - 1 + total) % total);
  };

  // Touch handling for swipe navigation
  const startXRef = useRef(null);
  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      startXRef.current = e.touches[0].clientX;
    }
  };
  const handleTouchEnd = (e) => {
    if (startXRef.current == null || !e.changedTouches || !e.changedTouches[0]) return;
    const endX = e.changedTouches[0].clientX;
    const diff = endX - startXRef.current;
    // Minimal threshold to prevent accidental swipes
    const threshold = 50;
    if (diff > threshold) {
      // Swipe right moves to previous image
      prev();
    } else if (diff < -threshold) {
      // Swipe left moves to next image
      next();
    }
    startXRef.current = null;
  };

  if (!total) return null;

  const current = normalised[index] || {};
  // If no src is available use a 1×1 transparent pixel so the layout doesn't break.
  const FALLBACK_PIXEL =
    'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
  const src = current.src || FALLBACK_PIXEL;

  return (
    <div className={styles.carousel}>
      <div
        className={styles.inner}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* The main image */}
        <img
          src={src}
          alt={
            total > 1 ? `Photo ${index + 1} of ${total}` : 'Photo'
          }
          className={styles.img}
        />
        {/* Navigation arrows, visible only if more than one image */}
        {total > 1 && (
          <>
            <button
              type="button"
              className={`${styles.nav} ${styles.prev}`}
              onClick={prev}
              aria-label="Previous photo"
            >
              ‹
            </button>
            <button
              type="button"
              className={`${styles.nav} ${styles.next}`}
              onClick={next}
              aria-label="Next photo"
            >
              ›
            </button>
          </>
        )}
      </div>
      {/* Dots indicator for current image */}
      {total > 1 && (
        <div className={styles.dots}>
          {normalised.map((_, i) => (
            <button
              // eslint-disable-next-line react/no-array-index-key
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
  );
}
