/**
 * Renders the content markup to HTML: plain text with inline math $...$, display math $$...$$,
 * a literal dollar sign as \$, blank-line paragraphs, and simple pipe tables (lines starting with |).
 * Math is rendered by KaTeX with MathML output, so screen readers get the semantic structure.
 * All plain text is HTML-escaped; KaTeX escapes its own output and runs with trust disabled.
 */
import katex from "katex";

type Options = { throwOnError?: boolean };

const cache = new Map<string, string>();
const CACHE_MAX = 4000;

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function math(tex: string, displayMode: boolean, opts: Options): string {
  return katex.renderToString(tex, {
    displayMode,
    throwOnError: opts.throwOnError ?? false,
    output: "htmlAndMathml",
    strict: "ignore",
    trust: false,
  });
}

/** Inline text with $...$ math (no block structure). */
export function renderInlineText(text: string, opts: Options = {}): string {
  let out = "";
  let i = 0;
  while (i < text.length) {
    if (text[i] === "\\" && text[i + 1] === "$") {
      out += "$";
      i += 2;
      continue;
    }
    if (text[i] === "$") {
      let j = i + 1;
      while (j < text.length && !(text[j] === "$" && text[j - 1] !== "\\")) j++;
      if (j >= text.length) {
        out += escapeHtml(text.slice(i));
        break;
      }
      out += math(text.slice(i + 1, j), false, opts);
      i = j + 1;
      continue;
    }
    let k = i;
    while (k < text.length && text[k] !== "$" && !(text[k] === "\\" && text[k + 1] === "$")) k++;
    out += escapeHtml(text.slice(i, k));
    i = k;
  }
  return out;
}

type Segment = { type: "text"; value: string } | { type: "display"; tex: string };

function splitDisplay(src: string): Segment[] {
  const out: Segment[] = [];
  const re = /(?<!\\)\$\$([\s\S]+?)\$\$/g;
  let last = 0;
  for (let m = re.exec(src); m; m = re.exec(src)) {
    if (m.index > last) out.push({ type: "text", value: src.slice(last, m.index) });
    out.push({ type: "display", tex: m[1].trim() });
    last = m.index + m[0].length;
  }
  if (last < src.length) out.push({ type: "text", value: src.slice(last) });
  return out;
}

function renderTable(lines: string[], opts: Options): string {
  const rows = lines.map((line) =>
    line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim()),
  );
  const [head, ...body] = rows;
  const th = head.map((c) => `<th scope="col">${renderInlineText(c, opts)}</th>`).join("");
  const tb = body.map((r) => `<tr>${r.map((c) => `<td>${renderInlineText(c, opts)}</td>`).join("")}</tr>`).join("");
  return `<div class="table-scroll"><table class="data-table"><thead><tr>${th}</tr></thead><tbody>${tb}</tbody></table></div>`;
}

function renderTextBlock(text: string, opts: Options): string {
  let html = "";
  for (const para of text.split(/\n\s*\n/)) {
    const lines = para.split("\n");
    let buffer: string[] = [];
    let table: string[] = [];
    const flushText = () => {
      const joined = buffer.join(" ").trim();
      if (joined) html += `<p>${renderInlineText(joined, opts)}</p>`;
      buffer = [];
    };
    const flushTable = () => {
      if (table.length) html += renderTable(table, opts);
      table = [];
    };
    for (const line of lines) {
      if (line.trim().startsWith("|")) {
        flushText();
        table.push(line);
      } else {
        flushTable();
        buffer.push(line);
      }
    }
    flushText();
    flushTable();
  }
  return html;
}

/** Full block rendering (paragraphs, display math, tables). */
export function renderRich(src: string, opts: Options = {}): string {
  const key = opts.throwOnError ? null : src;
  if (key !== null) {
    const hit = cache.get(key);
    if (hit !== undefined) return hit;
  }
  let html = "";
  for (const seg of splitDisplay(src)) {
    html += seg.type === "display" ? `<div class="math-display">${math(seg.tex, true, opts)}</div>` : renderTextBlock(seg.value, opts);
  }
  if (key !== null) {
    if (cache.size >= CACHE_MAX) cache.clear();
    cache.set(key, html);
  }
  return html;
}

/**
 * Short preview for lists. When the statement has display math, that math is what tells problems
 * apart, so show it (inline), led by a short instruction if there is one; otherwise show the text.
 * Tables are dropped.
 */
export function renderPreview(src: string): string {
  const segs = splitDisplay(src);
  const display = segs.find((s) => s.type === "display");
  const textOnly = (value: string) =>
    value
      .split("\n")
      .filter((l) => !l.trim().startsWith("|"))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  if (display && display.type === "display") {
    const lead = segs[0]?.type === "text" ? textOnly(segs[0].value) : "";
    const prefix = lead && lead.length <= 70 ? `${lead} ` : "";
    return renderInlineText(`${prefix}$${display.tex}$`);
  }
  return renderInlineText(textOnly(segs.map((s) => (s.type === "display" ? ` $${s.tex}$ ` : s.value)).join(" ")));
}

/** Plain-text version (for titles, aria labels and CSV): math source is kept, markup removed. */
export function plainText(src: string): string {
  return src
    .replace(/\$\$([\s\S]+?)\$\$/g, " $1 ")
    .replace(/(?<!\\)\$([^$]*)\$/g, "$1")
    .replace(/\\\$/g, "$")
    .replace(/\s+/g, " ")
    .trim();
}
