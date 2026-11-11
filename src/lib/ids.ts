/**
 * Shapes of ids the server actions accept from forms and the browser.
 * A problem id is its section and its OpenStax number (or an original's tag): "5.3-144" in an
 * Integration Review section, "2-208" in a Final Exam chapter.
 */
export const PROBLEM_ID_RE = /^[0-9]+(?:\.[0-9]+)?-[A-Za-z0-9]+$/;
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
