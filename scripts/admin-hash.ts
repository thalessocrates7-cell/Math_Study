/** Prints the ADMIN_CODE_HASH value for an access code: npm run admin:hash -- "your access code" */
import { hashAdminCode } from "../src/lib/admin-code";

const code = process.argv.slice(2).join(" ");
if (code.length < 10) {
  console.error('Usage: npm run admin:hash -- "your access code"   (use at least 10 characters)');
  process.exit(1);
}
console.log(hashAdminCode(code));
