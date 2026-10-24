import { expect, test, type Page } from "@playwright/test";

const signIn = async (page: Page, role: "Student" | "Coordinator" | "Admin") => {
  if (!page.url().endsWith("/login")) await page.goto("/login");
  await page.getByRole("button", { name: new RegExp(`Continue as ${role}`) }).click();
  await page.waitForURL(/\/(student|coordinator|admin)$/);
};

const signOut = async (page: Page) => {
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await page.waitForURL(/\/login$/);
};

test("one-click sign in lands each role on its own interface", async ({ page }) => {
  await signIn(page, "Student");
  await expect(page).toHaveURL(/\/student$/);
  await expect(page.getByRole("heading", { level: 1, name: "Discover" })).toBeVisible();
  await signOut(page);

  await signIn(page, "Coordinator");
  await expect(page.getByRole("heading", { level: 1, name: "My Events" })).toBeVisible();
  await signOut(page);

  await signIn(page, "Admin");
  await expect(page.getByRole("heading", { level: 1, name: "Admin Overview" })).toBeVisible();
});

test("a role cannot open another role's interface", async ({ page }) => {
  await signIn(page, "Student");
  await expect(page).toHaveURL(/\/student$/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/student$/);
});

test("every admin screen renders with a heading and no error state", async ({ page }) => {
  await signIn(page, "Admin");
  for (const [path, h1] of [["/admin/approvals", "Approvals"], ["/admin/calendar", "Calendar"], ["/admin/catalog", "Venues & Resources"], ["/admin/reports", "Reports"], ["/admin/notifications", "Notifications"]]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: h1 })).toBeVisible();
    await expect(page.getByText("We could not load this")).toHaveCount(0);
  }
});
