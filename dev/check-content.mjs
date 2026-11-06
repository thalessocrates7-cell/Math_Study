// Exports every problem's checks and verifies them with SymPy (dev/.venv).
// Setup once: python -m venv dev/.venv && dev/.venv/Scripts/python -m pip install sympy
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const python = process.platform === "win32"
  ? join(root, "dev", ".venv", "Scripts", "python.exe")
  : join(root, "dev", ".venv", "bin", "python");

if (!existsSync(python)) {
  console.error(`Missing ${python}. Create it with: python -m venv dev/.venv, then pip install sympy`);
  process.exit(2);
}

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { cwd: root, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

// Run tsx through node directly (no shell), so this works the same on Windows and elsewhere.
run(process.execPath, [join(root, "node_modules", "tsx", "dist", "cli.mjs"), join("dev", "export-checks.ts")]);
run(python, ["-I", join("dev", "verify_content.py"), join("dev", "checks.json")]);
