"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const SELECTOR = ".math-display, .table-scroll, .table-wrap";

/**
 * Wide equations and tables scroll sideways on small screens. Keyboard users must be able to reach
 * that scroll area (WCAG 2.1.1), so overflowing ones get tabindex=0 and a label; others are left alone.
 */
export function OverflowFocus() {
  const pathname = usePathname();
  useEffect(() => {
    const update = () => {
      document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
        const scrollable = el.scrollWidth > el.clientWidth + 1;
        if (scrollable && !el.hasAttribute("tabindex")) {
          el.setAttribute("tabindex", "0");
          el.dataset.overflowFocus = "1";
          if (!el.hasAttribute("role")) {
            el.setAttribute("role", "region");
            el.setAttribute("aria-label", el.classList.contains("math-display") ? "Wide math (scroll sideways)" : "Wide table (scroll sideways)");
          }
        } else if (!scrollable && el.dataset.overflowFocus) {
          el.removeAttribute("tabindex");
          el.removeAttribute("role");
          el.removeAttribute("aria-label");
          delete el.dataset.overflowFocus;
        }
      });
    };
    update();
    const resize = new ResizeObserver(update);
    resize.observe(document.body);
    const mutations = new MutationObserver(update);
    mutations.observe(document.body, { childList: true, subtree: true });
    return () => {
      resize.disconnect();
      mutations.disconnect();
    };
  }, [pathname]);
  return null;
}
