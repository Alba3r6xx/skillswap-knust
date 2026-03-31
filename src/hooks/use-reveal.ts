"use client";

import { useEffect, useRef } from "react";

/**
 * Lightweight IntersectionObserver hook that adds `.visible` to elements
 * with `.reveal`, `.reveal-left`, or `.reveal-scale` classes when they
 * enter the viewport. GPU-composited, zero-JS-per-frame — 120fps.
 *
 * Includes a safety timeout so content is never permanently invisible.
 */
export function useReveal() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const targets = root.querySelectorAll(".reveal, .reveal-left, .reveal-scale");
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05 }
    );

    targets.forEach((el) => observer.observe(el));

    // Safety: force-reveal everything after 1.5s in case observer doesn't fire
    const safetyTimer = setTimeout(() => {
      targets.forEach((el) => el.classList.add("visible"));
    }, 1500);

    return () => {
      observer.disconnect();
      clearTimeout(safetyTimer);
    };
  }, []);

  return containerRef;
}
