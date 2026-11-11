import type { Metadata } from "next";
import { PracticeView, type PracticeProps } from "@/components/views/PracticeView";

export const metadata: Metadata = { title: "Practice" };

export default function PracticePage(props: PracticeProps) {
  return <PracticeView prep="exam4" {...props} />;
}
