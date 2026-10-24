import { defineConfig } from "@playwright/test";

// Runs against a production build (`npm run build && npm start`) with the FastAPI backend on :8000.
export default defineConfig({
  testDir: "./e2e",
  workers: 1, // specs share one dev database
  use: { baseURL: process.env.E2E_URL ?? "http://localhost:3000", channel: "chrome", trace: "retain-on-failure" },
});
