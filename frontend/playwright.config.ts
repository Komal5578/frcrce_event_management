import { defineConfig } from "@playwright/test";

// Runs against E2E_URL or the local app; its /api rewrite uses BACKEND_URL from the app's environment.
export default defineConfig({
  testDir: "./e2e",
  workers: 1, // specs share one dev database
  use: { baseURL: process.env.E2E_URL ?? "http://localhost:3000", channel: "chrome", trace: "retain-on-failure" },
});
