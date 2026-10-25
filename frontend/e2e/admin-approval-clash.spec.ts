import { expect, test } from "@playwright/test";
import { signIn } from "./auth";

test("admin sees a venue clash and returns the request with a reason", async ({ page }) => {
  await signIn(page, "Admin");
  await page.goto("/admin/approvals/e0000000-0000-0000-0000-000000000002");

  await expect(page.getByText(/Annual Tech Fest Keynote, same venue/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve" })).toBeDisabled();
  await page.getByLabel("Reason, if returning").fill("Choose another venue or time.");
  await page.getByRole("button", { name: "Return with reason" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Confirm return" }).click();

  await expect(page).toHaveURL(/\/admin\/approvals$/);
  await expect(page.getByText("Robotics Guest Lecture")).toBeVisible();
});
