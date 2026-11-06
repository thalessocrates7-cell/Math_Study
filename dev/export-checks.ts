/** Writes dev/checks.json (every problem's machine checks) for dev/verify_content.py. */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ALL_PROBLEMS } from "../content/index";

const out = ALL_PROBLEMS.map((p) => ({
  id: p.id,
  checks: Array.isArray(p.check) ? p.check : [p.check],
}));

const target = fileURLToPath(new URL("./checks.json", import.meta.url));
writeFileSync(target, JSON.stringify(out, null, 2));
console.log(`Exported checks for ${out.length} problems to dev/checks.json`);
