import { useEffect, useRef, useState } from "react";

/**
 * useRevealOnce
 * Shared IntersectionObserver to add .is-visible to .reveal nodes on enter.
 * Default threshold/rootMargin match spec. Set once=false to allow repeats.
 */
export default function useRevealOnce(
  { threshold = 0.2, rootMargin = "0px 0px -10% 0px", once = true } = {}
) {
  const [nodes, setNodes] = useState([]);
  const ioRef = useRef(null);

  useEffect(() => {
    if (!nodes.length || typeof window === "undefined" || typeof IntersectionObserver === "undefined") return;

    ioRef.current = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            if (once) ioRef.current?.unobserve(e.target);
          } else if (!once) {
            e.target.classList.remove("is-visible");
          }
        }
      },
      { threshold, rootMargin }
    );

    nodes.forEach((n) => n && ioRef.current.observe(n));
    return () => {
      ioRef.current?.disconnect();
    };
  }, [nodes, threshold, rootMargin, once]);

  // ref-setter to register nodes
  return (el) => {
    if (!el) return;
    setNodes((prev) => (prev.includes(el) ? prev : [...prev, el]));
  };
}
