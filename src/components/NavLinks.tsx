"use client";

import {
  ChartColumn,
  House,
  LayoutDashboard,
  Library,
  ListChecks,
  Map,
  RefreshCw,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { isActive, navPath } from "@/lib/nav";

const ICONS = {
  home: House,
  plan: Map,
  review: RefreshCw,
  progress: ChartColumn,
  settings: Settings,
  overview: LayoutDashboard,
  students: Users,
  bank: Library,
  builder: ListChecks,
} as const;

export type NavItem = {
  href: string;
  label: string;
  short?: string;
  icon: keyof typeof ICONS;
  count?: number;
  /** Other path prefixes that should light this item up (e.g. /session for the Dashboard). */
  also?: string[];
};

function active(path: string, item: NavItem): boolean {
  return isActive(path, [item.href, ...(item.also ?? [])]);
}

/** The path the current page counts as (a practice problem counts as the place it was opened from). */
function useNavPath(): string {
  return navPath(usePathname(), useSearchParams());
}

export function SidebarNav({ items, label }: { items: NavItem[]; label: string }) {
  const path = useNavPath();
  return (
    <nav aria-label={label}>
      <ul className="nav">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const on = active(path, item);
          return (
            <li key={item.href}>
              <Link href={item.href} className="nav-link" aria-current={on ? "page" : undefined}>
                {/* One indicator, named for view transitions, so it glides to the new item. */}
                {on ? <span className="nav-indicator" aria-hidden="true" /> : null}
                <Icon size={20} aria-hidden="true" />
                <span>{item.label}</span>
                {item.count ? (
                  <span className="nav-count">
                    {item.count}
                    <span className="sr-only"> due</span>
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function TabBar({ items, label }: { items: NavItem[]; label: string }) {
  const path = useNavPath();
  return (
    <nav className="tabbar" aria-label={label}>
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const on = active(path, item);
        return (
          <Link key={item.href} href={item.href} className="tab" aria-current={on ? "page" : undefined}>
            {on ? <span className="tab-indicator" aria-hidden="true" /> : null}
            <Icon size={22} aria-hidden="true" />
            <span>{item.short ?? item.label}</span>
            {item.count ? (
              <span className="badge-dot">
                {item.count}
                <span className="sr-only"> due</span>
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
