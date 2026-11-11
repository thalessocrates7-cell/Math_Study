import type { Metadata } from "next";
import { PlanView, type SearchParams } from "@/components/views/PlanView";

export const metadata: Metadata = { title: "Study Plan" };

export default function PlanPage({ searchParams }: { searchParams: SearchParams }) {
  return <PlanView prep="exam4" searchParams={searchParams} />;
}
