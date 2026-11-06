import Link from "next/link";

export default function NotFound() {
  return (
    <main className="auth">
      <div className="auth-inner">
        <section className="card empty">
          <h1>Page not found</h1>
          <p className="text-2">That page or problem doesn&apos;t exist. It may have been removed by your instructor.</p>
          <div className="cluster" style={{ justifyContent: "center" }}>
            <Link className="btn btn-primary" href="/dashboard">
              Go to your dashboard
            </Link>
            <Link className="btn btn-secondary" href="/">
              Home
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
