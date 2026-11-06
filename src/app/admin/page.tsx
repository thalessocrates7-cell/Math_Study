import { Crown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/Brand";
import { AdminSignInForm } from "@/components/forms/AdminSignInForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { isAdmin } from "@/lib/auth";
import { readTheme } from "@/lib/session";

export const metadata: Metadata = { title: "Administrator Access" };

export default async function AdminSignInPage() {
  if (await isAdmin()) redirect("/admin/dashboard");
  const theme = await readTheme();
  return (
    <main className="auth">
      <div className="auth-inner">
        <div className="spread">
          <Brand />
          <ThemeToggle initial={theme} />
        </div>
        <section className="card auth-card stack-lg">
          <div style={{ textAlign: "center" }}>
            <span className="feature-icon" style={{ margin: "0 auto 12px" }} aria-hidden="true">
              <Crown size={22} />
            </span>
            <h1 id="admin-title">Administrator Access</h1>
            <p className="lede">Enter the administrator access code.</p>
          </div>
          <AdminSignInForm />
          <p className="small muted" style={{ textAlign: "center" }}>
            Authorized personnel only.
          </p>
        </section>
        <p className="small muted" style={{ textAlign: "center" }}>
          Student? <Link href="/signin">Sign in with your name</Link>.
        </p>
      </div>
    </main>
  );
}
