import type { Metadata } from "next";
import { ReviewView } from "@/components/views/ReviewView";

export const metadata: Metadata = { title: "Final Exam · Review Queue" };

export default function FinalReviewPage() {
  return <ReviewView prep="final" />;
}
