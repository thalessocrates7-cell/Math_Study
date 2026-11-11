import type { Metadata } from "next";
import { SessionView } from "@/components/views/SessionView";

export const metadata: Metadata = { title: "Final Exam · Today's Session" };

export default function FinalSessionPage() {
  return <SessionView prep="final" />;
}
