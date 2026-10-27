import { expect, type Page } from "@playwright/test";

export const ADMIN = { email: "admin@reloadux.com", state: "playwright/.auth/admin.json" };
export const VIEWER = { email: "viewer@reloadux.com", state: "playwright/.auth/viewer.json" };

const SIGN_IN_ATTEMPTS = 3;
const RELAY_READY_TIMEOUT_MS = 10_000;

/**
 * Signs in through the real login page: the Google popup is served by the
 * Firebase Auth Emulator, so every server-side check runs for real.
 * Stays on a /login page the test is already on, so its ?next= is kept.
 */
export async function signInThroughPopup(page: Page, email: string) {
  if (!new URL(page.url(), "http://localhost").pathname.startsWith("/login")) await page.goto("/login");

  for (let attempt = 1; attempt <= SIGN_IN_ATTEMPTS; attempt++) {
    const popupPromise = page.waitForEvent("popup");
    await page.getByRole("button", { name: "Continue with Google" }).click();
    const popup = await popupPromise;

    if (await relayIframeLoads(page)) {
      // The emulator's own page doesn't link labels to inputs, so use its element ids.
      await popup.locator("#add-account-button").click();
      await popup.locator("#email-input").fill(email);
      await popup.locator("#display-name-input").fill(email.split("@")[0] ?? email);
      await popup.locator("#sign-in").click();
      await popup.waitForEvent("close");
      return;
    }
    // Closing the popup makes Firebase give up on this attempt and re-enable the button.
    await popup.close();
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeEnabled({ timeout: 20_000 });
  }
  throw new Error(`Firebase's relay iframe never loaded in ${SIGN_IN_ATTEMPTS} sign-in attempts`);
}

/**
 * The popup reports back through a hidden emulator iframe that Firebase adds to
 * this page in the same click that opens the popup. When the popup wins that race
 * the iframe can stay stuck loading, and the sign-in result is lost, so check it
 * has loaded before signing in, and start over if it hasn't.
 */
async function relayIframeLoads(page: Page): Promise<boolean> {
  const loaded = async () => {
    const relay = page.frames().find((frame) => frame.url().includes("/emulator/auth/iframe"));
    return relay ? relay.evaluate(() => document.readyState === "complete").catch(() => false) : false;
  };
  try {
    await expect.poll(loaded, { timeout: RELAY_READY_TIMEOUT_MS }).toBe(true);
    return true;
  } catch {
    return false;
  }
}

export async function expectSignedIn(page: Page) {
  // The first visit compiles /projects in the dev server, which can take a while on a cold cache.
  await expect(page).toHaveURL(/\/projects/, { timeout: 50_000 });
  await expect(accountMenu(page)).toBeVisible();
}

/** Sign-out lives in the avatar menu in the header. */
export async function signOut(page: Page) {
  await accountMenu(page).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
}

function accountMenu(page: Page) {
  return page.getByRole("button", { name: /^Account menu for / });
}
