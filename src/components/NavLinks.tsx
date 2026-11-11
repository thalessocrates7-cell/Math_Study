"use client";

import {
  ArrowLeft,
  ChartColumn,
  GraduationCap,
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
import { useEffect, useState, type MouseEvent } from "react";
import { itemActive, navPath } from "@/lib/nav";
import { isFinalPath, RETURN_FALLBACK, returnCookieValue, returnPathFromCookies } from "@/lib/prep";

const ICONS = {
  home: House,
  plan: Map,
  review: RefreshCw,
  progress: ChartColumn,
  settings: Settings,
  final: GraduationCap,
  back: ArrowLeft,
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
  /** Light up only on the item's own address, not the pages below it (the Final Exam's Dashboard). */
  exact?: boolean;
  /**
   * Moves between the two study environments. "final" (the regular site's Final Exam item) remembers
   * where the student is; "exam4" (Integration Review, inside Final Exam) goes back there.
   */
  switchTo?: "final" | "exam4";
};

/** The path the current page counts as (a practice problem counts as the place it was opened from). */
function useNavPath(): string {
  return navPath(usePathname(), useSearchParams());
}

/** The Final Exam pages use their own item list; every other page uses the regular one. */
function useItems(items: NavItem[], finalItems?: NavItem[]): NavItem[] {
  const final = isFinalPath(usePathname());
  return final && finalItems ? finalItems : items;
}

/** Remembers the current place in the regular site, so Integration Review can bring the student back to it. */
export function rememberReturnPlace(): void {
  const value = returnCookieValue(window.location.pathname + window.location.search + window.location.hash);
  if (value) document.cookie = value;
}

/**
 * Where Integration Review goes: the place remembered when Final Exam was opened, or the regular
 * Dashboard (also on the first render, before the browser's cookie can be read).
 */
export function useReturnHref(): string {
  const pathname = usePathname();
  const [href, setHref] = useState(RETURN_FALLBACK);
  useEffect(() => {
    setHref(returnPathFromCookies(document.cookie));
  }, [pathname]);
  return href;
}

/** A link that switches environments (see NavItem.switchTo); any other item is a plain link. */
function ItemLink(props: { item: NavItem; className: string; current: boolean; children: React.ReactNode; ariaLabel?: string }) {
  const { item } = props;
  const back = useReturnHref();
  const href = item.switchTo === "exam4" ? back : item.href;
  const onClick = item.switchTo === "final" ? (_e: MouseEvent) => rememberReturnPlace() : undefined;
  return (
    <Link href={href} className={props.className} aria-current={props.current ? "page" : undefined} aria-label={props.ariaLabel} onClick={onClick}>
      {props.children}
    </Link>
  );
}

export function SidebarNav({ items, finalItems, label }: { items: NavItem[]; finalItems?: NavItem[]; label: string }) {
  const path = useNavPath();
  const list = useItems(items, finalItems);
  return (
    <nav aria-label={label}>
      <ul className="nav">
        {list.map((item) => {
          const Icon = ICONS[item.icon];
          const on = !item.switchTo && itemActive(path, item);
          return (
            <li key={`${item.href}:${item.label}`}>
              <ItemLink item={item} className="nav-link" current={on}>
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
              </ItemLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function TabBar({ items, finalItems, label }: { items: NavItem[]; finalItems?: NavItem[]; label: string }) {
  const path = useNavPath();
  const list = useItems(items, finalItems);
  return (
    <nav className="tabbar" aria-label={label}>
      {list.map((item) => {
        const Icon = ICONS[item.icon];
        const on = !item.switchTo && itemActive(path, item);
        return (
          <ItemLink key={`${item.href}:${item.label}`} item={item} className="tab" current={on}>
            {on ? <span className="tab-indicator" aria-hidden="true" /> : null}
            <Icon size={22} aria-hidden="true" />
            <span>{item.short ?? item.label}</span>
            {item.count ? (
              <span className="badge-dot">
                {item.count}
                <span className="sr-only"> due</span>
              </span>
            ) : null}
          </ItemLink>
        );
      })}
    </nav>
  );
}

/**
 * The phone top bar's way between the two environments (the tab bar keeps its five items):
 * "Final Exam" in the regular site, "Integration" (Review) inside Final Exam.
 */
export function TopbarSwitch({ toFinal, toRegular }: { toFinal: NavItem; toRegular: NavItem }) {
  const final = isFinalPath(usePathname());
  const item = final ? toRegular : toFinal;
  const Icon = ICONS[item.icon];
  return (
    <ItemLink item={item} className="topbar-switch" current={false} ariaLabel={item.label}>
      <Icon size={18} aria-hidden="true" />
      <span className="topbar-switch-text">{item.short ?? item.label}</span>
    </ItemLink>
  );
}

/** The sidebar and top-bar logo: home is the Dashboard of the environment on screen. */
export function ShellBrand({ regular, final }: { regular: React.ReactNode; final: React.ReactNode }) {
  return isFinalPath(usePathname()) ? <>{final}</> : <>{regular}</>;
}

/** The top-bar avatar: Settings of the environment on screen. */
export function SettingsAvatar({ regularHref, finalHref, label, children }: { regularHref: string; finalHref: string; label: string; children: React.ReactNode }) {
  const final = isFinalPath(usePathname());
  return (
    <Link href={final ? finalHref : regularHref} className="avatar" aria-label={label}>
      {children}
    </Link>
  );
}
