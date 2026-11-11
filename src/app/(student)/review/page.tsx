import type { Metadata } from "next";
import { ReviewView } from "@/components/views/ReviewView";

export const metadata: Metadata = { title: "Review Queue" };

export default function ReviewPage() {
  return <ReviewView prep="exam4" />;
}
