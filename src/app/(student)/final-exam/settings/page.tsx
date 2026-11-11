import type { Metadata } from "next";
import { SettingsView } from "@/components/views/SettingsView";

export const metadata: Metadata = { title: "Final Exam · Settings" };

export default function FinalSettingsPage() {
  return <SettingsView prep="final" />;
}
