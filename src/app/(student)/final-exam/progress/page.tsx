import type { Metadata } from "next";
import { ProgressView } from "@/components/views/ProgressView";

export const metadata: Metadata = { title: "Final Exam · My Progress" };

export default function FinalProgressPage() {
  return <ProgressView prep="final" />;
}
