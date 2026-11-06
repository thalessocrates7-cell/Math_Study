import Link from "next/link";

/** Logo + name. The link's accessible name is its visible text (WCAG 2.5.3 Label in Name). */
export function Brand({ href = "/", sub = "Calculus Study Platform" }: { href?: string; sub?: string }) {
  return (
    <Link href={href} className="brand">
      <span className="brand-tile" aria-hidden="true">
        ∫
      </span>
      <span className="brand-name">
        <strong>MTH 263</strong> <span>{sub}</span>
      </span>
    </Link>
  );
}
