import { Crown, LogOut } from "lucide-react";
import { adminSignOut } from "@/app/actions/auth";
import { Brand } from "@/components/Brand";
import { SidebarNav, TabBar, type NavItem } from "@/components/NavLinks";
import { ThemeToggle } from "@/components/ThemeToggle";
import { requireAdmin } from "@/lib/auth";
import { readTheme } from "@/lib/session";

const ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "Overview", icon: "overview" },
  { href: "/admin/students", label: "Students", icon: "students" },
  { href: "/admin/problems", label: "Problem Bank", short: "Problems", icon: "bank" },
  { href: "/admin/plan", label: "Study Plan", short: "Plan", icon: "builder" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const theme = await readTheme();
  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <aside className="sidebar">
        <Brand href="/admin/dashboard" sub="Admin" />
        <SidebarNav items={ITEMS} label="Admin" />
        <div className="sidebar-footer">
          <div className="spread">
            <span className="admin-mark">
              <Crown size={14} aria-hidden="true" />
              Administrator
            </span>
            <ThemeToggle initial={theme} />
          </div>
          <form action={adminSignOut}>
            <button className="btn btn-ghost btn-sm btn-block" type="submit">
              <LogOut size={16} aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <header className="topbar">
        <Brand href="/admin/dashboard" sub="Admin" />
        <div className="cluster">
          <ThemeToggle initial={theme} />
          <form action={adminSignOut}>
            <button className="icon-btn" type="submit" aria-label="Sign out of admin">
              <LogOut size={20} aria-hidden="true" />
            </button>
          </form>
        </div>
      </header>
      <main id="main" className="main" tabIndex={-1}>
        {children}
      </main>
      <TabBar items={ITEMS} label="Admin" />
    </div>
  );
}
