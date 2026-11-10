import { redirect } from "next/navigation";
import { parseLevel, planHref } from "@/lib/checklist";

type Props = {
  params: Promise<{ section: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** The old per-section page: forwards to the Study Plan, keeping the section and the level (?d=Ch). */
export default async function OldSectionPage({ params, searchParams }: Props) {
  const { section } = await params;
  const sp = await searchParams;
  redirect(planHref(decodeURIComponent(section), parseLevel(sp.d) ?? parseLevel(sp.level) ?? "core"));
}
