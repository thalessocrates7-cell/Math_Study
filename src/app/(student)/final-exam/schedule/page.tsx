import type { Metadata } from "next";
import { ScheduleView } from "@/components/views/ScheduleView";

export const metadata: Metadata = { title: "Final Exam · Study Schedule" };

export default function FinalSchedulePage() {
  return <ScheduleView prep="final" />;
}
