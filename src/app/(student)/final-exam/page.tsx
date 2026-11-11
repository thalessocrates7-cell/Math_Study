import type { Metadata } from "next";
import { DashboardView } from "@/components/views/DashboardView";

export const metadata: Metadata = { title: "Final Exam · Dashboard" };

/** The Final Exam's Dashboard: the regular one's layout, with the Final Exam's own records. */
export default function FinalDashboardPage() {
  return <DashboardView prep="final" />;
}
