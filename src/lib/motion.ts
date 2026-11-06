/**
 * Cross-fades a synchronous DOM change (the theme switch) with the View Transitions API.
 * Falls back to an instant change when the API is missing or the user prefers reduced motion.
 * Browser-only: call it from event handlers.
 */
export function crossFade(update: () => void): void {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || typeof document.startViewTransition !== "function") {
    update();
    return;
  }
  document.startViewTransition(update);
}
