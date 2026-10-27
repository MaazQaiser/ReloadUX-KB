import { expect, test } from "@playwright/test";
import { VIEWER } from "./helpers";

test.use({ storageState: VIEWER.state });

test.describe("projects grid", () => {
  test("lists every seeded project", async ({ page }) => {
    await page.goto("/projects");

    await expect(page.getByRole("heading", { level: 1, name: "Everything we've built." })).toBeVisible();
    // Other specs add projects in parallel, so check the seeded ones rather than a count.
    for (const name of ["Calmly Care", "Ledgerly", "Questline", "Learnloop"]) {
      await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
    }
    await expect(page.getByRole("link", { name: "projects", exact: true })).toHaveAttribute("aria-current", "page");
  });

  test("applies a filter as soon as it is picked and keeps it in the URL", async ({ page }) => {
    await page.goto("/projects");

    await page.getByLabel("Industry").selectOption("fintech");

    await expect(page).toHaveURL(/industry=fintech/);
    await expect(page.getByText("1 project match these filters")).toBeVisible();
    await expect(page.getByRole("link", { name: "Ledgerly" })).toBeVisible();
    await expect(page.getByLabel("Industry")).toHaveValue("fintech");
  });

  test("searches by client name", async ({ page }) => {
    await page.goto("/projects");

    await page.getByLabel("Search").fill("calmly health");
    await page.getByLabel("Search").press("Enter");

    await expect(page.getByRole("link", { name: "Calmly Care" })).toBeVisible();
    await expect(page.getByText("1 project match these filters")).toBeVisible();
  });

  test("shows an empty state and ignores unknown filter values", async ({ page }) => {
    await page.goto("/projects?industry=legal&flow=checkout&year=bogus");

    await expect(page.getByRole("heading", { name: "No projects found" })).toBeVisible();
    await expect(page.getByText("Ignored filters that weren't recognised: year.")).toBeVisible();

    await page.getByRole("link", { name: "Clear filters" }).click();
    await expect(page.getByRole("link", { name: "Calmly Care", exact: true })).toBeVisible();
  });

  test("opens a project from its card", async ({ page }) => {
    await page.goto("/projects");
    await page.getByRole("link", { name: "Postwise" }).click();

    await expect(page).toHaveURL(/\/projects\/postwise$/);
    await expect(page.getByRole("heading", { level: 1, name: "Postwise" })).toBeVisible();
  });
});

test.describe("project detail", () => {
  test("shows people, timeline, links and completeness", async ({ page }) => {
    await page.goto("/projects/calmly-care");

    await expect(page.getByRole("heading", { level: 1, name: "Calmly Care" })).toBeVisible();
    await expect(page.getByText("NDA", { exact: true })).toBeVisible();

    const people = page.getByRole("region", { name: "People" });
    await expect(people.getByText("Sara Malik")).toBeVisible();
    await expect(people.getByText("Zara Iqbal")).toBeVisible();

    await expect(page.getByRole("region", { name: "Timeline" }).getByText("14 Mar 2025")).toBeVisible();
    await expect(page.getByRole("link", { name: /Main file/ })).toHaveAttribute("target", "_blank");
    await expect(page.getByRole("meter", { name: "Record completeness" })).toHaveAttribute("aria-valuenow", "85");
  });

  test("marks missing fields as not recorded", async ({ page }) => {
    await page.goto("/projects/questline");

    const people = page.getByRole("region", { name: "People" });
    await expect(people.getByText("Hamza Tariq")).toBeVisible();
    await expect(people.getByText("not recorded")).toHaveCount(3);
  });

  test("shows a not-found page for an unknown project", async ({ page }) => {
    await page.goto("/projects/no-such-project");
    await expect(page.getByRole("heading", { name: "Project not found" })).toBeVisible();
  });
});
