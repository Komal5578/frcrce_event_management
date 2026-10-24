import { expect, test, type Page } from "@playwright/test";

const signIn = async (page: Page, role: "Student" | "Coordinator") => {
  await page.goto("/login");
  await page.getByRole("button", { name: new RegExp(`Continue as ${role}`) }).click();
  await page.waitForURL(/\/(student|coordinator)$/);
};

// Registers then cancels, so the seed data ends exactly as it started.
test("student registers through Review & Confirm and can cancel again", async ({ page }) => {
  await signIn(page, "Student");
  await page.getByRole("link", { name: /Annual Tech Fest Keynote/ }).first().click();
  await page.getByRole("button", { name: "Register" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Review before you register")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Go back" })).toBeFocused(); // safe choice first
  await dialog.getByRole("button", { name: "Confirm registration" }).click();
  await expect(page.getByRole("heading", { name: "You're registered" })).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: "Cancel my registration" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Confirm cancel" }).click();
  await expect(page.getByRole("heading", { name: "Registration cancelled" })).toBeVisible();
});

// Creates a draft and always discards it, even if an assertion fails.
test("coordinator walks the wizard to Review and discards the draft", async ({ page }) => {
  await signIn(page, "Coordinator");
  await page.goto("/coordinator/new");
  await page.getByRole("button", { name: /Workshop/ }).click();
  await expect(page).toHaveURL(/draft=/);
  try {
    await expect(page.getByLabel(/^Expected attendees/)).toHaveValue("40"); // pre-filled from the template
    await page.getByRole("button", { name: /Next: Venue/ }).click();
    await page.getByRole("group", { name: "Free venues" }).getByRole("button").first().click();
    await page.getByRole("button", { name: /Next: Resources/ }).click();
    await page.getByRole("button", { name: /Next: Tasks/ }).click();
    await page.getByRole("button", { name: /Next: Review/ }).click();
    await expect(page.getByText("Review before you submit")).toBeVisible();
  } finally {
    await page.getByRole("button", { name: "Discard draft" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Discard draft" }).click();
    await expect(page).toHaveURL(/\/coordinator$/);
  }
});
