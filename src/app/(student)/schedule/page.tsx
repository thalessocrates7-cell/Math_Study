import type { Metadata } from "next";
import { ScheduleView } from "@/components/views/ScheduleView";

export const metadata: Metadata = { title: "Study Schedule" };

export default function SchedulePage() {
  return <ScheduleView prep="exam4" />;
}
