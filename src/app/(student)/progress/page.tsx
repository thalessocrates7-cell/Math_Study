import type { Metadata } from "next";
import { ProgressView } from "@/components/views/ProgressView";

export const metadata: Metadata = { title: "My Progress" };

export default function ProgressPage() {
  return <ProgressView prep="exam4" />;
}
