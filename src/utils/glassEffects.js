// src/utils/glassEffects.js
/**
 * Utility functions for glassmorphism effects and animations
 */

/**
 * Check if browser supports backdrop-filter
 * @returns {boolean}
 */
export function supportsBackdropFilter() {
  if (typeof window === "undefined") return false;
  
  return (
    CSS.supports("backdrop-filter", "blur(10px)") ||
    CSS.supports("-webkit-backdrop-filter", "blur(10px)")
  );
}

/**
 * Get appropriate glass background based on browser support
 * @param {string} fallbackColor - Fallback color if backdrop-filter not supported
 * @returns {Object} - Style object
 */
export function getGlassBackground(fallbackColor = "rgba(255, 255, 255, 0.85)") {
  if (supportsBackdropFilter()) {
    return {
      background: "var(--glass-bg, rgba(255, 255, 255, 0.1))",
      backdropFilter: "var(--blur-md, blur(12px))",
      WebkitBackdropFilter: "var(--blur-md, blur(12px))",
    };
  }
  
  return {
    background: fallbackColor,
  };
}

/**
 * Calculate optimal blur amount based on device performance
 * @returns {string} - Blur value
 */
export function getOptimalBlur() {
  if (typeof window === "undefined") return "blur(12px)";
  
  // Check for low-end device indicators
  const isLowEnd =
    navigator.hardwareConcurrency <= 4 ||
    navigator.deviceMemory <= 4 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  
  return isLowEnd ? "blur(8px)" : "blur(12px)";
}

/**
 * Apply glass effect to element with performance considerations
 * @param {HTMLElement} element
 * @param {Object} options
 */
export function applyGlassEffect(element, options = {}) {
  if (!element) return;
  
  const {
    blur = "12px",
    background = "rgba(255, 255, 255, 0.1)",
    border = "1px solid rgba(255, 255, 255, 0.18)",
    borderRadius = "16px",
    shadow = "0 8px 32px rgba(31, 38, 135, 0.15)",
  } = options;
  
  const styles = getGlassBackground();
  
  Object.assign(element.style, {
    ...styles,
    border,
    borderRadius,
    boxShadow: shadow,
  });
}

/**
 * Create animated gradient background
 * @param {HTMLElement} element
 * @param {Array} colors - Array of color stops
 */
export function createAnimatedGradient(element, colors = []) {
  if (!element) return;
  
  const defaultColors = [
    "#667eea 0%",
    "#764ba2 100%",
  ];
  
  const gradientColors = colors.length > 0 ? colors : defaultColors;
  const gradient = `linear-gradient(135deg, ${gradientColors.join(", ")})`;
  
  element.style.background = gradient;
  element.style.backgroundSize = "200% 200%";
  element.style.animation = "gradientShift 15s ease infinite";
}

/**
 * Add hover lift effect to element
 * @param {HTMLElement} element
 * @param {number} liftAmount - Amount to lift in pixels
 */
export function addHoverLift(element, liftAmount = 2) {
  if (!element) return;
  
  element.style.transition = "transform 0.24s cubic-bezier(0.4, 0, 0.2, 1)";
  
  element.addEventListener("mouseenter", () => {
    element.style.transform = `translateY(-${liftAmount}px)`;
  });
  
  element.addEventListener("mouseleave", () => {
    element.style.transform = "translateY(0)";
  });
}

/**
 * Create parallax effect on scroll
 * @param {HTMLElement} element
 * @param {number} speed - Parallax speed (0-1)
 */
export function createParallaxEffect(element, speed = 0.5) {
  if (!element || typeof window === "undefined") return;
  
  const handleScroll = () => {
    const scrolled = window.pageYOffset;
    const offset = scrolled * speed;
    element.style.transform = `translateY(${offset}px)`;
  };
  
  window.addEventListener("scroll", handleScroll, { passive: true });
  
  return () => {
    window.removeEventListener("scroll", handleScroll);
  };
}

/**
 * Add ripple effect on click
 * @param {HTMLElement} element
 * @param {string} color - Ripple color
 */
export function addRippleEffect(element, color = "rgba(255, 255, 255, 0.5)") {
  if (!element) return;
  
  element.style.position = "relative";
  element.style.overflow = "hidden";
  
  element.addEventListener("click", (e) => {
    const ripple = document.createElement("span");
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${color};
      left: ${x}px;
      top: ${y}px;
      transform: scale(0);
      animation: ripple 0.6s ease-out;
      pointer-events: none;
    `;
    
    element.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  });
}

/**
 * Check if user prefers reduced motion
 * @returns {boolean}
 */
export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Get safe animation duration based on user preference
 * @param {number} duration - Desired duration in ms
 * @returns {number} - Safe duration
 */
export function getSafeAnimationDuration(duration) {
  return prefersReducedMotion() ? 1 : duration;
}

/**
 * Create frosted glass overlay
 * @param {Object} options
 * @returns {HTMLElement}
 */
export function createFrostedOverlay(options = {}) {
  const {
    blur = "16px",
    background = "rgba(255, 255, 255, 0.1)",
    zIndex = 1000,
  } = options;
  
  const overlay = document.createElement("div");
  
  const styles = getGlassBackground(background);
  
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    zIndex: String(zIndex),
    ...styles,
  });
  
  return overlay;
}

/**
 * Animate element with spring physics
 * @param {HTMLElement} element
 * @param {Object} from - Starting values
 * @param {Object} to - Ending values
 * @param {Object} config - Spring configuration
 */
export function springAnimate(element, from, to, config = {}) {
  if (!element) return;
  
  const {
    tension = 170,
    friction = 26,
    mass = 1,
  } = config;
  
  // Simple spring animation implementation
  let currentValue = from.y || 0;
  let velocity = 0;
  const targetValue = to.y || 0;
  
  const animate = () => {
    const spring = -tension * (currentValue - targetValue);
    const damper = -friction * velocity;
    const acceleration = (spring + damper) / mass;
    
    velocity += acceleration * 0.016; // 60fps
    currentValue += velocity * 0.016;
    
    element.style.transform = `translateY(${currentValue}px)`;
    
    if (Math.abs(velocity) > 0.1 || Math.abs(currentValue - targetValue) > 0.1) {
      requestAnimationFrame(animate);
    }
  };
  
  animate();
}

// Export all utilities
export default {
  supportsBackdropFilter,
  getGlassBackground,
  getOptimalBlur,
  applyGlassEffect,
  createAnimatedGradient,
  addHoverLift,
  createParallaxEffect,
  addRippleEffect,
  prefersReducedMotion,
  getSafeAnimationDuration,
  createFrostedOverlay,
  springAnimate,
};
