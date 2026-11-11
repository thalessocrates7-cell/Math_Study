import type { Metadata } from "next";
import { PlanView, type SearchParams } from "@/components/views/PlanView";

export const metadata: Metadata = { title: "Final Exam · Study Plan" };

export default function FinalPlanPage({ searchParams }: { searchParams: SearchParams }) {
  return <PlanView prep="final" searchParams={searchParams} />;
}
