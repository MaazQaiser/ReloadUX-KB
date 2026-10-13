import { expect, type Page } from "@playwright/test";

export const ADMIN = { email: "admin@reloadux.com", state: "playwright/.auth/admin.json" };
export const VIEWER = { email: "viewer@reloadux.com", state: "playwright/.auth/viewer.json" };

/**
 * Signs in through the real login page: the Google popup is served by the
 * Firebase Auth Emulator, so every server-side check runs for real.
 */
export async function signInThroughPopup(page: Page, email: string) {
  await page.goto("/login");
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Continue with Google" }).click();
  const popup = await popupPromise;
  // The popup reports back through Firebase's hidden iframe on this page. A script that
  // signs in faster than that iframe loads loses the result, so wait for it first.
  await expect
    .poll(() => page.frames().some((frame) => frame.url().includes("/emulator/auth/iframe")), { timeout: 30_000 })
    .toBe(true);

  // The emulator's own page doesn't link labels to inputs, so use its element ids.
  await popup.locator("#add-account-button").click();
  await popup.locator("#email-input").fill(email);
  await popup.locator("#display-name-input").fill(email.split("@")[0] ?? email);
  await popup.locator("#sign-in").click();
  await popup.waitForEvent("close");
}

export async function expectSignedIn(page: Page) {
  // The first visit compiles /projects in the dev server, which can take a while on a cold cache.
  await expect(page).toHaveURL(/\/projects/, { timeout: 50_000 });
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
}
