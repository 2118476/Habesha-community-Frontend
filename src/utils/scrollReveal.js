/**
 * Modern Scroll Reveal System
 * 
 * Automatically reveals elements with [data-reveal] attribute when they
 * enter the viewport. Uses IntersectionObserver for performance.
 * 
 * Usage:
 * - Add data-reveal="up|down|left|right|scale|blur|zoom" to any element
 * - Add data-reveal="list-up|list-down|..." for staggered children
 * - Customize with CSS variables: --reveal-delay, --reveal-stagger, etc.
 */

class ScrollReveal {
  constructor(options = {}) {
    this.options = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
      once: true,
      ...options
    };
    
    this.observer = null;
    this.init();
  }

  init() {
    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver not supported, revealing all elements immediately');
      this.revealAll();
      return;
    }

    // Create observer
    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        threshold: this.options.threshold,
        rootMargin: this.options.rootMargin
      }
    );

    // Observe all elements with data-reveal
    this.observeElements();
  }

  observeElements() {
    const elements = document.querySelectorAll('[data-reveal]');
    elements.forEach(el => {
      // Don't observe if already revealed
      if (el.getAttribute('data-inview') === 'true') return;
      this.observer.observe(el);
    });
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.reveal(entry.target);
        
        // Stop observing if once is true
        if (this.options.once) {
          this.observer.unobserve(entry.target);
        }
      } else if (!this.options.once) {
        // Hide again if not once
        entry.target.setAttribute('data-inview', 'false');
      }
    });
  }

  reveal(element) {
    // Add a small delay for smoother appearance
    requestAnimationFrame(() => {
      element.setAttribute('data-inview', 'true');
      
      // Dispatch custom event for additional hooks
      element.dispatchEvent(new CustomEvent('revealed', {
        bubbles: true,
        detail: { element }
      }));
    });
  }

  revealAll() {
    const elements = document.querySelectorAll('[data-reveal]');
    elements.forEach(el => {
      el.setAttribute('data-inview', 'true');
    });
  }

  refresh() {
    // Disconnect and reinitialize
    if (this.observer) {
      this.observer.disconnect();
    }
    this.init();
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Auto-initialize on DOM ready
let scrollRevealInstance = null;

function initScrollReveal(options) {
  if (scrollRevealInstance) {
    scrollRevealInstance.destroy();
  }
  
  scrollRevealInstance = new ScrollReveal(options);
  return scrollRevealInstance;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initScrollReveal());
} else {
  initScrollReveal();
}

// Re-observe on route changes (for SPAs)
if (typeof window !== 'undefined') {
  // Listen for custom route change events
  window.addEventListener('routechange', () => {
    if (scrollRevealInstance) {
      setTimeout(() => scrollRevealInstance.observeElements(), 100);
    }
  });
  
  // Also listen for popstate (browser back/forward)
  window.addEventListener('popstate', () => {
    if (scrollRevealInstance) {
      setTimeout(() => scrollRevealInstance.observeElements(), 100);
    }
  });
}

export { ScrollReveal, initScrollReveal, scrollRevealInstance };
export default ScrollReveal;
