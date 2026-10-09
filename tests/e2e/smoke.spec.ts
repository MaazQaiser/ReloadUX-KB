import { expect, test } from "@playwright/test";

test("home page renders the reloadux wordmark and heading", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("reloadux project intelligence");
  await expect(page.getByRole("link", { name: "reloadux" })).toHaveAttribute("href", "/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("project intelligence");
});
