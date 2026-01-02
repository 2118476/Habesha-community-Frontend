// src/utils/scrollMotion.js
// Advanced, transform-only scroll motion utilities for the Feed/Homepage.
//
// Design goals
// - Scroll-driven entrances for every `.feedSection[data-motion]`
// - Parallax hero that only runs while on screen
// - Zero layout thrash (rAF + read/write separation)
// - Respects `prefers-reduced-motion`
// - Plays nicely with CSS Modules + global `.feedSection` styles

const isBrowser = typeof window !== "undefined";

const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const lerp = (a, b, t) => a + (b - a) * t;

function prefersReducedMotion() {
  if (!isBrowser || !window.matchMedia) return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/* ========================================================================== */
/*  Section reveal observer                                                    */
/* ========================================================================== */

/**
 * Mount one-time reveal observers for `.feedSection[data-motion]` blocks.
 *
 * Each section starts in an offset / scaled transform state that is defined in
 * `src/stylus/sections/FeedPage.module.scss`. When it first intersects the
 * viewport we:
 *   - set CSS custom properties for duration / delay / amplitude
 *   - add the `.is-in` class
 *   - set `data-visible="true"` (handy for CSS fallbacks)
 *
 * CSS takes care of the actual transform animation so this file stays logic-only.
 */
export function mountSectionReveals({
  root = null,
  selector = ".feedSection[data-motion]",
  threshold = 0.16,
  rootMargin = "0px 0px -15% 0px",
  once = true,
} = {}) {
  if (!isBrowser) return () => {};

  const reduced = prefersReducedMotion();

  const applyImmediate = (el) => {
    if (!el) return;
    const dur = parseInt(el.getAttribute("data-dur") || "420", 10);
    const delay = parseInt(el.getAttribute("data-delay") || "0", 10);
    const ease = el.getAttribute("data-ease") || "cubic-bezier(.22,.8,.32,1)";
    const baseAmp = parseFloat(el.getAttribute("data-amp") || "1") || 1;

    const vw = Math.max(320, window.innerWidth || 1024);
    const scale =
      vw <= 560 ? 0.9 :
      vw <= 820 ? 0.95 :
      1;

    const amp = baseAmp * scale;

    el.style.setProperty("--reveal-dur", `${Math.max(1, dur)}ms`);
    el.style.setProperty("--reveal-delay", `${Math.max(0, delay)}ms`);
    el.style.setProperty("--reveal-ease", ease);
    el.style.setProperty("--reveal-amp", String(amp));

    el.dataset.visible = "true";
    el.classList.add("is-in");
  };

  // If reduced motion, mark everything as visible and bail.
  if (reduced || !("IntersectionObserver" in window)) {
    const nodes = Array.from(document.querySelectorAll(selector));
    nodes.forEach(applyImmediate);
    return () => {};
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target;
        applyImmediate(el);
        if (once) io.unobserve(el);
      }
    },
    { root, threshold, rootMargin }
  );

  const observeExisting = () => {
    const nodes = Array.from(document.querySelectorAll(selector));
    nodes.forEach((el) => {
      if (el.dataset.visible === "true") return;
      io.observe(el);
    });
  };

  observeExisting();

  // Watch for dynamically added sections (e.g. infinite scroll).
  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        if (node.matches && node.matches(selector)) {
          io.observe(node);
        }
        node
          .querySelectorAll &&
          node
            .querySelectorAll(selector)
            .forEach((el) => io.observe(el));
      });
    }
  });

  mo.observe(document.body, { childList: true, subtree: true });

  return () => {
    io.disconnect();
    mo.disconnect();
  };
}

/**
 * Manually recompute amplitude variables for all feed sections.
 * Helpful after a breakpoint change (e.g. orientation swap).
 */
export function refreshSectionRevealVars(selector = ".feedSection[data-motion]") {
  if (!isBrowser) return;
  const nodes = Array.from(document.querySelectorAll(selector));
  nodes.forEach((el) => {
    // remove cached values so `mountSectionReveals` logic recomputes
    el.style.removeProperty("--reveal-amp");
    el.style.removeProperty("--reveal-dur");
    el.style.removeProperty("--reveal-delay");
    el.style.removeProperty("--reveal-ease");
  });
}

/* ========================================================================== */
/*  Hero parallax                                                             */
/* ========================================================================== */

/**
 * Attach a scroll-driven parallax effect to the hero wrapper.
 *
 * We keep the actual transform in CSS:
 *   .section--hero { transform: translateY(var(--hero-parallax-y)) scale(var(--hero-parallax-scale)); }
 *
 * This function simply updates those variables in a rAF loop while the hero is
 * in view.
 */
export function mountHeroParallax(
  selector = ".section--hero",
  strength = 0.18,
  {
    damping = 0.15,      // 0-1, higher = snappier
    maxShiftPx,          // optional cap for translateY magnitude
    scaleEntrance = true // small 1.04 → 1.00 entrance scale
  } = {}
) {
  if (!isBrowser) return () => {};

  const el = document.querySelector(selector);
  if (!el) return () => {};

  const reduced = prefersReducedMotion();
  if (reduced) {
    el.style.setProperty("--hero-parallax-progress", "0");
    el.style.setProperty("--hero-parallax-y", "0px");
    el.style.setProperty("--hero-parallax-scale", "1");
    return () => {};
  }

  let active = false;
  let frameId = null;
  let targetProgress = 0;
  let currentProgress = 0;
  let lastTime = performance.now();
  let heroHeight = Math.max(el.offsetHeight || 1, 320);

  const recomputeHeight = () => {
    heroHeight = Math.max(el.offsetHeight || heroHeight, 320);
  };

  const gate = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.target !== el) continue;
        active = entry.isIntersecting;
        if (active && frameId == null) {
          lastTime = performance.now();
          frameId = requestAnimationFrame(loop);
        }
      }
    },
    {
      threshold: 0,
      rootMargin: "-10% 0px -65% 0px",
    }
  );
  gate.observe(el);

  const onScroll = () => {
    if (!active) return;
    const scrollY =
      window.scrollY ||
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      0;

    // Hero is at the top of the page; measure progress over its height + viewport.
    const denom = heroHeight + (window.innerHeight || heroHeight);
    const raw = denom > 0 ? scrollY / denom : 0;
    targetProgress = clamp(raw, 0, 1);
  };

  const loop = (now) => {
    const dt = Math.min(100, now - lastTime);
    lastTime = now;

    const t = 1 - Math.pow(1 - damping, dt / (1000 / 60));
    currentProgress = lerp(currentProgress, targetProgress, clamp(t, 0, 1));

    // translateY goes upward as we scroll
    const baseShift = (maxShiftPx || heroHeight * strength * 0.6) * -1;
    const shift = baseShift * currentProgress;

    const eased = 1 - Math.pow(1 - currentProgress, 3);
    const scale = scaleEntrance ? 1.04 - 0.04 * eased : 1;

    el.style.setProperty("--hero-parallax-progress", eased.toFixed(4));
    el.style.setProperty("--hero-parallax-y", `${shift.toFixed(2)}px`);
    el.style.setProperty("--hero-parallax-scale", scale.toFixed(3));

    if (!active || Math.abs(currentProgress - targetProgress) < 0.0005) {
      frameId = null;
      return;
    }
    frameId = requestAnimationFrame(loop);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", recomputeHeight, { passive: true });

  const onVis = () => {
    if (document.visibilityState !== "visible") {
      targetProgress = currentProgress = 0;
      el.style.setProperty("--hero-parallax-y", "0px");
      el.style.setProperty("--hero-parallax-scale", "1");
    }
  };
  document.addEventListener("visibilitychange", onVis);

  // Prime initial values
  recomputeHeight();
  onScroll();

  return () => {
    gate.disconnect();
    if (frameId != null) cancelAnimationFrame(frameId);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", recomputeHeight);
    document.removeEventListener("visibilitychange", onVis);
  };
}

/* ========================================================================== */
/*  Optional: peekStrip tilt helper (used for small card marquee)             */
/* ========================================================================== */

/**
 * Attach a subtle 3D tilt to cards inside a `.peekTrack` row.
 * This is purely pointer-driven (not strictly scroll-driven) but keeps the
 * motion language consistent with the rest of the Feed.
 */
export function mountTiltTrack(selector = ".peekTrack") {
  if (!isBrowser) return () => {};
  const root = document.querySelector(selector);
  if (!root) return () => {};

  const items = Array.from(root.querySelectorAll(".peekItem"));
  if (!items.length) return () => {};

  const supportsFinePointer =
    window.matchMedia &&
    window.matchMedia("(pointer: fine)").matches;

  if (!supportsFinePointer) {
    return () => {};
  }

  const cleanups = [];

  items.forEach((item) => {
    let rect = item.getBoundingClientRect();

    const onEnter = () => {
      rect = item.getBoundingClientRect();
      item.style.setProperty("--tilt-x", "0deg");
      item.style.setProperty("--tilt-y", "0deg");
      item.style.setProperty("--tilt-scale", "1.02");
    };

    const onMove = (e) => {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const px = clamp(x / rect.width, 0, 1) - 0.5;
      const py = clamp(y / rect.height, 0, 1) - 0.5;
      const rx = (-py * 6).toFixed(2) + "deg";
      const ry = (px * 6).toFixed(2) + "deg";
      item.style.setProperty("--tilt-x", rx);
      item.style.setProperty("--tilt-y", ry);
      item.style.setProperty("--tilt-scale", "1.02");
    };

    const onLeave = () => {
      item.style.setProperty("--tilt-x", "0deg");
      item.style.setProperty("--tilt-y", "0deg");
      item.style.setProperty("--tilt-scale", "1");
    };

    const ro = new ResizeObserver(() => {
      rect = item.getBoundingClientRect();
    });
    ro.observe(item);

    item.addEventListener("mouseenter", onEnter);
    item.addEventListener("mousemove", onMove);
    item.addEventListener("mouseleave", onLeave);

    cleanups.push(() => {
      item.removeEventListener("mouseenter", onEnter);
      item.removeEventListener("mousemove", onMove);
      item.removeEventListener("mouseleave", onLeave);
      ro.disconnect();
      onLeave();
    });
  });

  return () => cleanups.forEach((fn) => fn());
}
