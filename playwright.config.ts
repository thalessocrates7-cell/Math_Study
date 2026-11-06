import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run against a production build (`npm run e2e` builds first) on its own port and
 * its own throwaway PGlite database (.data/e2e), so they never touch your local development data.
 * The admin code below is a test-only credential for that throwaway server.
 */
const PORT = 3270;
export const E2E_ADMIN_CODE = "e2e-admin-code-2026";

export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  outputDir: "test-results/e2e",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chrome", use: { ...devices["Desktop Chrome"], channel: "chrome" } }],
  webServer: {
    command: `node e2e/serve.mjs ${PORT}`,
    url: `http://localhost:${PORT}/signin`,
    timeout: 180_000,
    reuseExistingServer: false,
    stdout: "pipe",
    env: {
      PGLITE_DIR: ".data/e2e",
      SESSION_SECRET: "e2e-only-session-secret-0123456789-abcdefghij",
      ADMIN_CODE_HASH: "scrypt:16384:8:1:2FIknj2kM3zHR_f_1n-jkQ:_2XoNcy36mWSpJ7bwP4GGeqGkclVAd88rYAE9P9PcME",
      REQUIRE_SESSION_SECRET: "1",
    },
  },
});
