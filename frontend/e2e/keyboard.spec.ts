import { expect, test } from "@playwright/test";

// WCAG 2.1.1 / 2.4.3 / 2.4.7: the primary flows work without a mouse, focus is visible and returns where it came from.
test("student can open and dismiss Review & Confirm using only the keyboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Continue as Student/ }).focus();
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/student$/);
  await page.getByRole("link", { name: /Annual Tech Fest Keynote/ }).first().focus();
  await page.keyboard.press("Enter");
  const register = page.getByRole("button", { name: "Register" });
  await register.focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Go back" })).toBeFocused();
  await page.keyboard.press("Tab"); // trapped: stays inside the dialog
  await expect(dialog.getByRole("button", { name: "Confirm registration" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(register).toBeFocused(); // focus comes back to the trigger
});

test("a visible focus ring is drawn on keyboard focus", async ({ page }) => {
  await page.goto("/login");
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement!).outlineStyle);
  expect(outline).not.toBe("none");
});
