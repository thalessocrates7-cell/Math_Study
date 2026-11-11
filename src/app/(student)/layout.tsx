import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { Brand } from "@/components/Brand";
import { SettingsAvatar, ShellBrand, SidebarNav, TabBar, TopbarSwitch, type NavItem } from "@/components/NavLinks";
import { ThemeSwitch, ThemeToggle } from "@/components/ThemeToggle";
import { getDb } from "@/db/client";
import { requireStudent } from "@/lib/auth";
import { todayISO } from "@/lib/dates";
import { initials } from "@/lib/names";
import { RETURN_FALLBACK, routesFor } from "@/lib/prep";
import { readTheme } from "@/lib/session";
import { dueReviewCount } from "@/server/progress";

const regular = routesFor("exam4");
const final = routesFor("final");

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const student = await requireStudent();
  const db = await getDb();
  const today = todayISO();
  const [due, dueFinal, theme] = await Promise.all([dueReviewCount(db, student.id, today, "exam4"), dueReviewCount(db, student.id, today, "final"), readTheme()]);
  // The regular site (Integration Review) and the Final Exam use the same pages, each with its own data.
  const items: NavItem[] = [
    { href: regular.dashboard, label: "Dashboard", short: "Home", icon: "home", also: [regular.session] },
    { href: regular.plan, label: "Study Plan", short: "Plan", icon: "plan" },
    { href: regular.review, label: "Review Queue", short: "Review", icon: "review", count: due },
    { href: regular.progress, label: "My Progress", short: "Progress", icon: "progress" },
  ];
  const finalItems: NavItem[] = [
    { href: final.dashboard, label: "Dashboard", short: "Home", icon: "home", exact: true, also: [final.session] },
    { href: final.plan, label: "Study Plan", short: "Plan", icon: "plan" },
    { href: final.review, label: "Review Queue", short: "Review", icon: "review", count: dueFinal },
    { href: final.progress, label: "My Progress", short: "Progress", icon: "progress" },
  ];
  const settings: NavItem = { href: regular.settings, label: "Settings", short: "Settings", icon: "settings", also: [regular.schedule] };
  const finalSettings: NavItem = { href: final.settings, label: "Settings", short: "Settings", icon: "settings", also: [final.schedule] };
  // Directly under Settings: into the Final Exam, and (inside it) back to Integration Review.
  const toFinal: NavItem = { href: final.dashboard, label: "Final Exam", short: "Final Exam", icon: "final", switchTo: "final" };
  const toRegular: NavItem = { href: RETURN_FALLBACK, label: "Integration Review", short: "Integration", icon: "back", switchTo: "exam4" };
  const name = `${student.firstName} ${student.lastName}`;

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <aside className="sidebar">
        <ShellBrand regular={<Brand href={regular.dashboard} sub="Calculus" />} final={<Brand href={final.dashboard} sub="Final Exam" />} />
        <SidebarNav items={items} finalItems={finalItems} label="Main" />
        <div className="sidebar-bottom">
          <ThemeSwitch initial={theme} />
          <SidebarNav items={[settings, toFinal]} finalItems={[finalSettings, toRegular]} label="Account" />
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
        <ShellBrand regular={<Brand href={regular.dashboard} sub="Calculus" />} final={<Brand href={final.dashboard} sub="Final Exam" />} />
        <div className="cluster topbar-actions">
          <TopbarSwitch toFinal={toFinal} toRegular={toRegular} />
          <ThemeToggle initial={theme} />
          <SettingsAvatar regularHref={regular.settings} finalHref={final.settings} label={`${name}: settings and sign out`}>
            {initials(student.firstName, student.lastName)}
          </SettingsAvatar>
        </div>
      </header>
      <main id="main" className="main" tabIndex={-1}>
        {children}
      </main>
      <TabBar items={[...items, settings]} finalItems={[...finalItems, finalSettings]} label="Main" />
    </div>
  );
}
