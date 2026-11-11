import type { Metadata } from "next";
import { PracticeView, type PracticeProps } from "@/components/views/PracticeView";

export const metadata: Metadata = { title: "Final Exam · Practice" };

export default function FinalPracticePage(props: PracticeProps) {
  return <PracticeView prep="final" {...props} />;
}
