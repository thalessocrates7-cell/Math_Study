import type { ProblemImage } from "@content/types";

/**
 * An original source figure a question depends on (e.g. an OpenStax graph), shown as the image itself
 * on a white panel in both themes, with a full text alternative. Its size is reserved, so the page
 * doesn't jump while it loads.
 */
export function SourceFigure({ image }: { image: ProblemImage }) {
  return (
    <figure className="plot source-figure">
      <img src={image.src} alt={image.alt} width={image.width} height={image.height} decoding="async" />
    </figure>
  );
}
