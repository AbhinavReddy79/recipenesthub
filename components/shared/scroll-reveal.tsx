"use client";

import { useEffect } from "react";

/**
 * Mounted once in the root layout. Fades `[data-reveal]` sections in as they scroll into view (items inside a
 * `[data-reveal-grid]` follow one after another). Does nothing when the
 * visitor prefers reduced motion.
 *
 * It adds `data-revealed` outside React, sometimes before a streamed Suspense
 * boundary has hydrated, so every `[data-reveal]` element also carries
 * `suppressHydrationWarning`.
 */
export function ScrollReveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;

    const root = document.documentElement;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.revealed = "";
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );

    const observe = () =>
      document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-revealed])").forEach((el) => observer.observe(el));

    // Sections that load later (e.g. signed-in "Picked for you") get observed too.
    const mutations = new MutationObserver(observe);
    mutations.observe(document.body, { childList: true, subtree: true });

    observe();
    root.classList.add("js-reveal");
    return () => {
      observer.disconnect();
      mutations.disconnect();
      root.classList.remove("js-reveal");
    };
  }, []);

  return null;
}
