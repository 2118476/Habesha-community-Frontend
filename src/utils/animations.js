// src/utils/animations.js
// Lightweight, dependency-free reveal-on-scroll utilities.
// Usage:
//  1) Add className="reveal" to elements you want to animate.
//  2) Call const { observe } = useScrollReveal(); then ref={observe} on those elements
//  3) Include styles/reveal.scss once globally.

import { useEffect, useRef, useCallback } from "react";

export function useScrollReveal(options = { threshold: 0.15, rootMargin: "0px 0px -10% 0px", once: true }) {
  const observerRef = useRef(null);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const el = entry.target;
        if (entry.isIntersecting) {
          el.setAttribute("data-visible", "true");
          if (options.once !== false && observerRef.current) {
            observerRef.current.unobserve(el);
          }
        }
      });
    }, { threshold: options.threshold ?? 0.15, rootMargin: options.rootMargin ?? "0px 0px -10% 0px" });

    return () => observerRef.current?.disconnect();
  }, [options.threshold, options.rootMargin, options.once]);

  const observe = useCallback((node) => {
    if (!node) return;
    node.classList.add("reveal");
    observerRef.current?.observe(node);
  }, []);

  return { observe };
}
