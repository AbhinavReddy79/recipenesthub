"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Opens every new page at the top. Next.js only scrolls when the new page's top
 * is out of view, which the entrance animation can confuse, so links clicked low
 * on a page (e.g. in the footer) could land mid-page. Back/forward keeps the
 * browser's own scroll restoration, and links to a section (#reviews) are left alone.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  const firstRender = useRef(true);
  const fromHistory = useRef(false);

  useEffect(() => {
    const onPopState = () => {
      fromHistory.current = true;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (fromHistory.current) {
      fromHistory.current = false;
      return;
    }
    if (window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
