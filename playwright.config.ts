import { defineConfig, devices } from "@playwright/test";

/**
 * Testy E2E (issue #20, AGENTS.md „Testy E2E”): chromium i webkit, headless, `workers` z
 * `playwright_workers` w docs/konfiguracja.md. Adres serwisu z BASE_URL (np. staging); bez
 * BASE_URL Playwright sam stawia `pnpm dev` na porcie 8080 (port z konfiguracji Lovable).
 * Dane pochodzą z lokalnej bazy z migracji i `supabase/seed.sql` (job CI `e2e`).
 */
const baseUrlZEnv = process.env["BASE_URL"]?.trim();
const baseURL = baseUrlZEnv || "http://localhost:8080";
const wCi = Boolean(process.env["CI"]);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: wCi,
  retries: 0,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  // Raport HTML także lokalnie (#35): README każe go otwierać `playwright show-report`.
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    headless: true,
    locale: "pl-PL",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  ...(baseUrlZEnv
    ? {}
    : {
        webServer: {
          command: "pnpm dev",
          url: baseURL,
          reuseExistingServer: !wCi,
          timeout: 180_000,
          stdout: "ignore",
          stderr: "pipe",
        },
      }),
});
