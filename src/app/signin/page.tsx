import { Crown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/Brand";
import { SignInForm } from "@/components/forms/SignInForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { currentStudent } from "@/lib/auth";
import { readTheme } from "@/lib/session";
import { PageTransition } from "@/components/PageTransition";

export const metadata: Metadata = { title: "Student Sign In" };

export default async function SignInPage() {
  if (await currentStudent()) redirect("/dashboard");
  const theme = await readTheme();
  return (
    <PageTransition>
      <main className="auth">
        <div className="auth-inner">
          <div className="spread">
            <Brand />
            <ThemeToggle initial={theme} />
          </div>
          <section className="card auth-card stack-lg">
            <div>
              <h1 id="signin-title">Welcome</h1>
              <p className="lede">Enter your name to access your MTH 263 Exam 4 study plan.</p>
            </div>
            <SignInForm />
          </section>
          <p className="small muted">
            Use your full name. Anyone who types the same name opens the same plan, so there is no password to remember.
          </p>
          <div className="auth-foot">
            <Crown size={18} aria-hidden="true" style={{ flex: "none", marginTop: 2 }} />
            <p>
              <Link href="/admin">Administrator Access</Link>
              <br />
              For instructors and developers only.
            </p>
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
