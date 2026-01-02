// src/hooks/useScrollReveal.js
import { useEffect, useRef } from "react";

/**
 * Custom hook for scroll-triggered reveal animations
 * Uses Intersection Observer API for performance
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Visibility threshold (0-1)
 * @param {string} options.rootMargin - Root margin for observer
 * @param {boolean} options.triggerOnce - Whether to trigger animation only once
 * @returns {Object} - Ref object to attach to elements
 */
export default function useScrollReveal(options = {}) {
  const {
    threshold = 0.1,
    rootMargin = "0px 0px -50px 0px",
    triggerOnce = true,
  } = options;
  
  const elementsRef = useRef([]);
  
  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    
    if (prefersReducedMotion) {
      // Skip animations if user prefers reduced motion
      elementsRef.current.forEach((el) => {
        if (el) {
          el.style.opacity = "1";
          el.style.transform = "none";
        }
      });
      return;
    }
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Add visible class or inline styles
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
            
            // Add data attribute for CSS animations
            entry.target.setAttribute("data-revealed", "true");
            
            // Unobserve if triggerOnce is true
            if (triggerOnce) {
              observer.unobserve(entry.target);
            }
          } else if (!triggerOnce) {
            // Reset if not triggerOnce
            entry.target.style.opacity = "0";
            entry.target.style.transform = "translateY(20px)";
            entry.target.setAttribute("data-revealed", "false");
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );
    
    // Observe all elements
    const currentElements = elementsRef.current.filter(Boolean);
    currentElements.forEach((el) => {
      if (el) {
        // Set initial state
        el.style.opacity = "0";
        el.style.transform = "translateY(20px)";
        el.style.transition = "opacity 0.6s ease-out, transform 0.6s ease-out";
        
        observer.observe(el);
      }
    });
    
    // Cleanup
    return () => {
      currentElements.forEach((el) => {
        if (el) observer.unobserve(el);
      });
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce]);
  
  return elementsRef;
}

/**
 * Hook for staggered reveal animations
 * Each element gets a progressive delay
 * 
 * @param {number} staggerDelay - Delay between each element (ms)
 * @param {Object} options - Same as useScrollReveal options
 * @returns {Object} - Ref object to attach to elements
 */
export function useStaggeredReveal(staggerDelay = 80, options = {}) {
  const elementsRef = useRef([]);
  
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    
    if (prefersReducedMotion) {
      elementsRef.current.forEach((el) => {
        if (el) {
          el.style.opacity = "1";
          el.style.transform = "none";
        }
      });
      return;
    }
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = elementsRef.current.indexOf(entry.target);
            const delay = index * staggerDelay;
            
            setTimeout(() => {
              entry.target.style.opacity = "1";
              entry.target.style.transform = "translateY(0)";
              entry.target.setAttribute("data-revealed", "true");
            }, delay);
            
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || "0px 0px -50px 0px",
      }
    );
    
    const currentElements = elementsRef.current.filter(Boolean);
    currentElements.forEach((el) => {
      if (el) {
        el.style.opacity = "0";
        el.style.transform = "translateY(20px)";
        el.style.transition = "opacity 0.6s ease-out, transform 0.6s ease-out";
        observer.observe(el);
      }
    });
    
    return () => {
      currentElements.forEach((el) => {
        if (el) observer.unobserve(el);
      });
      observer.disconnect();
    };
  }, [staggerDelay, options.threshold, options.rootMargin]);
  
  return elementsRef;
}
