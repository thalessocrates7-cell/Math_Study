import { renderPreview, renderRich } from "@/lib/tex";

/** Server-rendered text + math (KaTeX HTML with MathML for screen readers). */
export function Rich({ src, className, id }: { src: string; className?: string; id?: string }) {
  return <div id={id} className={className ? `rich ${className}` : "rich"} dangerouslySetInnerHTML={{ __html: renderRich(src) }} />;
}

/** One-line preview of a problem statement, clamped by CSS. */
export function Preview({ src }: { src: string }) {
  return <span className="preview" dangerouslySetInnerHTML={{ __html: renderPreview(src) }} />;
}
