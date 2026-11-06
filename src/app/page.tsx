import { ArrowRight, Brain, Layers, RefreshCw, Zap } from "lucide-react";
import Link from "next/link";
import { ATTRIBUTION, SECTIONS } from "@content/index";
import { Brand } from "@/components/Brand";
import { ThemeToggle } from "@/components/ThemeToggle";
import { currentStudent } from "@/lib/auth";
import { readTheme } from "@/lib/session";
import { renderInlineText } from "@/lib/tex";
import { PageTransition } from "@/components/PageTransition";

const FEATURES = [
  { icon: Layers, title: "Structured", text: "Organized by the calculus sections on Exam 4, from antiderivatives to inverse trig integrals." },
  { icon: Brain, title: "Personalized", text: "Your plan adapts to how confident you feel after each problem." },
  { icon: Zap, title: "Progressive", text: "Problems climb from Foundation to Core to Challenge, with hints and worked steps when you need them." },
  { icon: RefreshCw, title: "Spaced review", text: "Shaky and Lost problems come back at the right time, with similar or easier practice." },
];

const STEPS = [
  { n: "01", title: "Start your plan", text: "Enter your name and get your personalized study plan." },
  { n: "02", title: "Solve and learn", text: "Work through problems of increasing difficulty. Use a hint, the answer, or the worked solution when you need it." },
  { n: "03", title: "Review and improve", text: "Rate your confidence, and practice similar problems to strengthen what you struggle with." },
];

function HeroArt() {
  return (
    <div className="hero-art" role="img" aria-label="Graph of a curve with the area under it shaded between a and b, labeled with the integral from a to b of f of x dx.">
      <svg viewBox="0 0 400 260" aria-hidden="true">
        <defs>
          <clipPath id="hero-clip">
            <rect x="96" y="0" width="200" height="220" />
          </clipPath>
        </defs>
        <line className="axis" x1="40" y1="220" x2="380" y2="220" />
        <line className="axis" x1="60" y1="240" x2="60" y2="16" />
        <path className="shade" clipPath="url(#hero-clip)" d="M60 220 C 100 30, 150 40, 190 140 S 290 150, 370 40 L 370 220 Z" />
        <path className="curve" d="M60 220 C 100 30, 150 40, 190 140 S 290 150, 370 40" />
        <line className="axis" x1="96" y1="214" x2="96" y2="226" />
        <line className="axis" x1="296" y1="214" x2="296" y2="226" />
        <text className="label" x="92" y="244">a</text>
        <text className="label" x="292" y="244">b</text>
        <text className="label" x="372" y="238">x</text>
        <text className="label" x="44" y="26">y</text>
      </svg>
      <span className="math-chip math-chip-a" aria-hidden="true" dangerouslySetInnerHTML={{ __html: renderInlineText("$\\displaystyle\\int_a^b f(x)\\,dx$") }} />
      <span className="math-chip math-chip-b" aria-hidden="true" dangerouslySetInnerHTML={{ __html: renderInlineText("$F'(x)=f(x)$") }} />
    </div>
  );
}

export default async function Home() {
  const [student, theme] = await Promise.all([currentStudent(), readTheme()]);
  const primary = student ? { href: "/dashboard", label: "Go to your dashboard" } : { href: "/signin", label: "Get Started" };

  return (
    <PageTransition>
      <div className="site">
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <header className="site-header">
          <div className="site-header-inner">
            <Brand />
            <nav className="site-nav" aria-label="Site">
              <a href="#how">How It Works</a>
              <a href="#topics">Topics</a>
              {student ? null : <Link href="/signin">Sign In</Link>}
            </nav>
            <div className="cluster">
              <ThemeToggle initial={theme} />
              <Link className="btn btn-primary btn-sm" href={primary.href}>
                {student ? "Dashboard" : "Get Started"}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </header>

        <main id="main">
          <section className="site-section hero" aria-labelledby="hero-title">
            <div>
              <p className="kicker">MTH 263 · Exam 4 preparation</p>
              <h1 id="hero-title">Prepare smarter. Understand calculus.</h1>
              <p className="hero-lede">
                A personalized study plan for Exam 4: practice OpenStax problems one at a time, get a hint or the worked solution when you
                need it, and come back to the ones that felt shaky.
              </p>
              <div className="hero-actions">
                <Link className="btn btn-primary btn-lg" href={primary.href}>
                  {primary.label}
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <a className="btn btn-secondary btn-lg" href="#how">
                  Explore How It Works
                </a>
              </div>
            </div>
            <HeroArt />
          </section>

          <section className="site-section" aria-labelledby="features-title">
            <div className="section-head">
              <h2 id="features-title">Built for one problem at a time</h2>
            </div>
            <ul className="grid grid-4" style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {FEATURES.map((f) => (
                <li key={f.title} className="card">
                  <span className="feature-icon" aria-hidden="true">
                    <f.icon size={22} />
                  </span>
                  <h3>{f.title}</h3>
                  <p className="small text-2" style={{ marginTop: 6 }}>
                    {f.text}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section id="how" className="site-section" aria-labelledby="how-title">
            <div className="section-head">
              <h2 id="how-title">How it works</h2>
              <p>Three steps, repeated until the exam.</p>
            </div>
            <ol className="grid grid-3" style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {STEPS.map((s) => (
                <li key={s.n} className="card">
                  <span className="step-num" aria-hidden="true">
                    {s.n}
                  </span>
                  <h3 style={{ marginTop: 8 }}>{s.title}</h3>
                  <p className="small text-2" style={{ marginTop: 6 }}>
                    {s.text}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section id="topics" className="site-section" aria-labelledby="topics-title">
            <div className="section-head">
              <h2 id="topics-title">Topics covered</h2>
              <p>The eight sections of OpenStax Calculus Volume 1 on Exam 4, in study order.</p>
            </div>
            <ul className="grid grid-4" style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {SECTIONS.map((s) => (
                <li key={s.id} className="topic-card">
                  <span className="topic-num">{s.id}</span>
                  <span className="small" style={{ fontWeight: 600 }}>
                    {s.title}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </main>

        <footer className="site-footer">
          <div className="site-footer-inner">
            <nav className="footer-links" aria-label="Footer">
              <a href="#how">How It Works</a>
              <a href="#topics">Topics</a>
              <Link href={student ? "/dashboard" : "/signin"}>{student ? "Dashboard" : "Sign In"}</Link>
            </nav>
            <p>{ATTRIBUTION}</p>
            <p>© 2026 MTH 263 Calculus Study Platform. Only your name and study progress are stored.</p>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
}
