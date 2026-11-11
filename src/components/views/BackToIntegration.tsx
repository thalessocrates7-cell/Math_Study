"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useReturnHref } from "@/components/NavLinks";

/**
 * "Back to Integration Review" on the Final Exam Dashboard: returns to the exact place the student
 * left in the regular site (remembered when they opened Final Exam), else to the regular Dashboard.
 */
export function BackToIntegration() {
  const href = useReturnHref();
  return (
    <Link className="btn btn-secondary btn-sm back-link" href={href}>
      <ArrowLeft size={16} aria-hidden="true" />
      Back to Integration Review
    </Link>
  );
}
