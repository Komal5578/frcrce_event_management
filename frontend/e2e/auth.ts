import type { Page } from "@playwright/test";

const accounts = {
  Student: "student@demo.college.test",
  Coordinator: "coordinator@demo.college.test",
  Admin: "admin@demo.college.test",
} as const;

export async function signIn(page: Page, role: keyof typeof accounts, email: string = accounts[role]) {
  await page.goto("/login");
  await page.getByLabel("College email").fill(email);
  await page.getByLabel("Password").fill("demo-password-2026");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(new RegExp(`/${role.toLowerCase()}$`));
}
