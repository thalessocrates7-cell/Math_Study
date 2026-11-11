import type { Metadata } from "next";
import { SessionView } from "@/components/views/SessionView";

export const metadata: Metadata = { title: "Today's Session" };

export default function SessionPage() {
  return <SessionView prep="exam4" />;
}
