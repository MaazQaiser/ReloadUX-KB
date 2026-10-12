import { expect, test } from "@playwright/test";
import { expectSignedIn, signInThroughPopup, VIEWER } from "./helpers";

test.describe("signed out", () => {
  test("is sent to sign in, then back to the page they asked for", async ({ page }) => {
    await page.goto("/projects/ledgerly");
    await expect(page).toHaveURL(/\/login\?next=%2Fprojects%2Fledgerly/);

    await signInThroughPopup(page, "returning@reloadux.com");
    await expect(page).toHaveURL(/\/projects\/ledgerly$/);
    await expect(page.getByRole("heading", { level: 1, name: "Ledgerly" })).toBeVisible();
  });

  test("can't sign in with an account outside reloadux.com", async ({ page }) => {
    await signInThroughPopup(page, "someone@gmail.com");

    await expect(page.getByRole("alert").filter({ hasText: "Use your" })).toHaveText("Use your reloadux.com Google account.");
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/projects");
    await expect(page).toHaveURL(/\/login/);
  });

  test("can't use a look-alike domain", async ({ page }) => {
    await signInThroughPopup(page, "someone@reloadux.com.evil.io");
    await expect(page.getByRole("alert").filter({ hasText: "Use your" })).toHaveText("Use your reloadux.com Google account.");
  });
});

test.describe("signed in", () => {
  test("signing out ends the session", async ({ page }) => {
    await signInThroughPopup(page, "leaving@reloadux.com");
    await expectSignedIn(page);

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/projects");
    await expect(page).toHaveURL(/\/login/);
  });

  test("viewers see their role and can't reach editor pages", async ({ browser }) => {
    const context = await browser.newContext({ storageState: VIEWER.state });
    const page = await context.newPage();

    await page.goto("/projects");
    await expect(page.getByText("viewer@reloadux.com · viewer").or(page.getByText("viewer · viewer"))).toBeVisible();
    await expect(page.getByRole("link", { name: "Add project" })).toHaveCount(0);

    await page.goto("/projects/new");
    await expect(page).toHaveURL(/\/forbidden$/);
    await page.goto("/projects/calmly-care/edit");
    await expect(page).toHaveURL(/\/forbidden$/);
    await context.close();
  });
});
