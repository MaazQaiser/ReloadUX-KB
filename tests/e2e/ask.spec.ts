import { expect, test } from "@playwright/test";
import { VIEWER } from "./helpers";

test.use({ storageState: VIEWER.state });

test.describe("ask", () => {
  test("home greets you and offers starter questions", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1, name: /here to help/ })).toBeVisible();
    await expect(page.getByText("Preview data")).toBeVisible();
    await expect(page.getByRole("link", { name: "home", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("button", { name: "Have we done a healthcare chatbot?" })).toBeVisible();
  });

  test("a starter question streams a verdict, a project card and records used", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Have we done a healthcare chatbot?" }).click();

    const answer = page.getByRole("region", { name: "Answer" });
    await expect(answer.getByText("Yes", { exact: true })).toBeVisible();
    // Cards open the project in a side panel rather than linking away.
    await expect(answer.getByRole("list", { name: "Matching projects" }).getByRole("button", { name: /^Calmly Care/ })).toBeVisible();
    await expect(answer.getByText("Records used:")).toBeVisible();

    await answer.getByRole("button", { name: "No, not useful" }).click();
    await answer.getByLabel("What was wrong? (optional)").fill("Missing the newer project.");
    await answer.getByRole("button", { name: "Send feedback" }).click();
    await expect(answer.getByText("Thanks for the feedback.")).toBeVisible();
  });

  test("typed questions are sent with Enter, and unknown ones say it's a preview", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Ask about past projects").fill("Who is our accountant?");
    await page.getByLabel("Ask about past projects").press("Enter");

    await expect(page.getByText("You asked:").locator("..")).toContainText("Who is our accountant?");
    await expect(page.getByText(/agent isn't connected yet/)).toBeVisible();
    await expect(page.getByLabel("Ask about past projects")).toHaveValue("");
  });
});
