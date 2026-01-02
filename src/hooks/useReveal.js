// src/hooks/useReveal.js
import { useEffect, useRef } from "react";

/**
 * Observe elements matching the selector and set data-inview="true"
 * when they enter the viewport. Defaults target [data-reveal] and
 * [data-reveal^="list"] containers for staggered children.
 */
export default function useReveal(options = {}) {
  const ref = useRef(null);
  const {
    selector = "[data-reveal], [data-reveal^='list']",
    threshold = 0.12,
    rootMargin = "0px 0px -8% 0px",
    once = true,
  } = options;

  useEffect(() => {
    const rootNode = ref.current || document;
    let targets = [];

    if (rootNode instanceof Document) {
      targets = Array.from(rootNode.querySelectorAll(selector));
    } else {
      targets = Array.from(rootNode.querySelectorAll(selector));
    }
    if (!targets.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.setAttribute("data-inview", "true");
            if (once) io.unobserve(e.target);
          }
        });
      },
      { threshold, root: null, rootMargin }
    );

    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [selector, threshold, rootMargin, once]);

  return ref;
}
