import { LogOut } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { Brand } from "@/components/Brand";
import { SidebarNav, TabBar, type NavItem } from "@/components/NavLinks";
import { ThemeSwitch, ThemeToggle } from "@/components/ThemeToggle";
import { getDb } from "@/db/client";
import { requireStudent } from "@/lib/auth";
import { todayISO } from "@/lib/dates";
import { initials } from "@/lib/names";
import { readTheme } from "@/lib/session";
import { dueReviewCount } from "@/server/progress";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const student = await requireStudent();
  const db = await getDb();
  const [due, theme] = await Promise.all([dueReviewCount(db, student.id, todayISO()), readTheme()]);
  const items: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", short: "Home", icon: "home", also: ["/session"] },
    { href: "/plan", label: "Study Plan", short: "Plan", icon: "plan", also: ["/practice"] },
    { href: "/review", label: "Review Queue", short: "Review", icon: "review", count: due },
    { href: "/progress", label: "My Progress", short: "Progress", icon: "progress" },
  ];
  const settings: NavItem = { href: "/settings", label: "Settings", short: "Settings", icon: "settings", also: ["/schedule"] };
  const name = `${student.firstName} ${student.lastName}`;

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <aside className="sidebar">
        <Brand href="/dashboard" sub="Calculus" />
        <SidebarNav items={items} label="Main" />
        <div className="sidebar-bottom">
          <ThemeSwitch initial={theme} />
          <SidebarNav items={[settings]} label="Account" />
        </div>
        <div className="sidebar-footer">
          <form action={signOut}>
            <button className="nav-link nav-signout" type="submit">
              <LogOut size={20} aria-hidden="true" />
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </aside>
      <header className="topbar">
        <Brand href="/dashboard" sub="Calculus" />
        <div className="cluster">
          <ThemeToggle initial={theme} />
          <Link href="/settings" className="avatar" aria-label={`${name}: settings and sign out`}>
            {initials(student.firstName, student.lastName)}
          </Link>
        </div>
      </header>
      <main id="main" className="main" tabIndex={-1}>
        {children}
      </main>
      <TabBar items={[...items, settings]} label="Main" />
    </div>
  );
}
