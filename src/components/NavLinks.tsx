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
import { usePathname } from "next/navigation";

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
  /** Other path prefixes that should light this item up (e.g. /practice for the study plan). */
  also?: string[];
};

function active(pathname: string, item: NavItem): boolean {
  const prefixes = [item.href, ...(item.also ?? [])];
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function SidebarNav({ items, label }: { items: NavItem[]; label: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label}>
      <ul className="nav">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const on = active(pathname, item);
          return (
            <li key={item.href}>
              <Link href={item.href} className="nav-link" aria-current={on ? "page" : undefined}>
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
  const pathname = usePathname();
  return (
    <nav className="tabbar" aria-label={label}>
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const on = active(pathname, item);
        return (
          <Link key={item.href} href={item.href} className="tab" aria-current={on ? "page" : undefined}>
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
