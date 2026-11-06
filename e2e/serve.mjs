// Starts `next start` for the e2e tests with a fresh throwaway database (.data/e2e).
import { spawn } from "node:child_process";
import { rmSync } from "node:fs";
import { join } from "node:path";

const port = process.argv[2] ?? "3270";
const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
rmSync(join(root, ".data", "e2e"), { recursive: true, force: true });

const nextBin = join(root, "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [nextBin, "start", "-p", port], { cwd: root, stdio: "inherit", env: process.env });
const stop = () => child.kill();
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
child.on("exit", (code) => process.exit(code ?? 0));
