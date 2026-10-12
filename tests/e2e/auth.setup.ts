import { test as setup } from "@playwright/test";
import { ADMIN, expectSignedIn, signInThroughPopup, VIEWER } from "./helpers";

for (const account of [ADMIN, VIEWER]) {
  setup(`sign in as ${account.email}`, async ({ page }) => {
    await signInThroughPopup(page, account.email);
    await expectSignedIn(page);
    await page.context().storageState({ path: account.state });
  });
}
