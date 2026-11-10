import { ViewTransition } from "react";

// Animation classes are styled in app.css ("motion: route transitions"). Link transition types:
// "nav-forward" = next step in a flow (slides left), "nav-back" = the step before (slides right),
// "same-page" = a filter on the same page (no motion).
const ENTER = { "nav-forward": "nav-forward", "nav-back": "nav-back", "same-page": "none", default: "page-enter" };
const EXIT = { "nav-forward": "nav-forward", "nav-back": "nav-back", "same-page": "none", default: "page-exit" };

/**
 * Route-change motion: the new page fades and rises in while the old one fades out quickly.
 * Wrap each page's content (not a layout or template: their segments persist between pages like
 * /plan and /plan/5.2, so enter/exit would never fire). default="none" keeps same-page refreshes
 * (ratings, notes, admin saves) from animating.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter={ENTER} exit={EXIT} default="none">
      {children}
    </ViewTransition>
  );
}
