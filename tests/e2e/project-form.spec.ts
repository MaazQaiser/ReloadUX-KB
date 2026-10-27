import { expect, test, type Page } from "@playwright/test";
import { ADMIN } from "./helpers";

test.use({ storageState: ADMIN.state });

// Unique per run so retries never collide with an earlier attempt's project.
const uniqueName = (label: string) => `E2E ${label} ${Date.now().toString(36)}`;

async function fillRequired(page: Page, name: string) {
  await page.getByRole("textbox", { name: "Project name", exact: true }).fill(name);
  await page.getByRole("combobox", { name: "Industry", exact: true }).selectOption("other");
  await page.getByRole("combobox", { name: "Status", exact: true }).selectOption("delivered");
  await page.getByRole("group", { name: "Product type" }).getByText("web app", { exact: true }).click();
  await page.getByRole("combobox", { name: "Lead designer", exact: true }).selectOption({ label: "Sara Malik" });
  await page.getByRole("textbox", { name: "Summary", exact: true }).fill("A project created by the end-to-end tests.");
}

test("an admin creates a project and lands on its page", async ({ page }) => {
  const name = uniqueName("create");
  await page.goto("/projects");
  await page.getByRole("link", { name: "Add project" }).click();
  await expect(page.getByRole("heading", { name: "Add a project" })).toBeVisible();

  await fillRequired(page, name);
  await page.getByLabel("Client", { exact: true }).fill("Test Client");
  await page.getByRole("group", { name: "Flows" }).getByText("checkout", { exact: true }).click();
  await page.getByRole("button", { name: "Add Figma file" }).click();
  await page.getByLabel("Figma files 1 Label").fill("Main file");
  await page.getByLabel("Figma files 1 URL").fill("https://example.com/figma/e2e");
  await page.getByRole("button", { name: "Create project" }).click();

  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  await expect(page.getByText("Test Client")).toBeVisible();
  await expect(page.getByRole("link", { name: /Main file/ })).toHaveAttribute("href", "https://example.com/figma/e2e");
  await expect(page.getByRole("region", { name: "People" }).getByText("Sara Malik")).toBeVisible();
});

test("missing required fields are reported next to each field", async ({ page }) => {
  await page.goto("/projects/new");
  await page.getByRole("button", { name: "Create project" }).click();

  const summary = page.getByRole("alert").filter({ hasText: "Some fields need fixing." });
  await expect(summary).toBeVisible();
  await expect(summary).toBeFocused();
  await expect(page.getByRole("textbox", { name: "Project name", exact: true })).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("textbox", { name: "Summary", exact: true })).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("combobox", { name: "Lead designer", exact: true })).toHaveAttribute("aria-invalid", "true");
});

test("bad links and dates are rejected with field errors", async ({ page }) => {
  await page.goto("/projects/new");
  await fillRequired(page, uniqueName("invalid"));
  await page.getByRole("button", { name: "Add live link" }).click();
  await page.getByLabel("Live links 1 Label").fill("App");
  await page.getByLabel("Live links 1 URL").fill("javascript:alert(1)");
  await page.getByLabel("Start date", { exact: true }).fill("2025-05-01");
  await page.getByLabel("Delivery date", { exact: true }).fill("2025-04-01");
  await page.getByRole("button", { name: "Create project" }).click();

  await expect(page.getByLabel("Live links 1 URL")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("delivery date can't be before the start date", { exact: true })).toBeVisible();
});

test("a duplicate name is refused", async ({ page }) => {
  await page.goto("/projects/new");
  await fillRequired(page, "Calmly Care");
  await page.getByRole("button", { name: "Create project" }).click();

  await expect(page.getByText("A project with this name already exists.")).toBeVisible();
  await expect(page.getByText(/Already used by \/projects\/calmly-care/).first()).toBeVisible();
});

test("an admin edits a project; its address stays the same", async ({ page }) => {
  const name = uniqueName("edit");
  await page.goto("/projects/new");
  await fillRequired(page, name);
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  const address = page.url();

  await page.getByRole("link", { name: "Edit project" }).click();
  await expect(page.getByRole("textbox", { name: "Project name", exact: true })).toHaveValue(name);
  await page.getByRole("textbox", { name: "Project name", exact: true }).fill(`${name} renamed`);
  await page.getByRole("textbox", { name: "Country", exact: true }).fill("Pakistan");
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page.getByRole("heading", { level: 1, name: `${name} renamed` })).toBeVisible();
  expect(page.url()).toBe(address);
  await expect(page.getByText("Pakistan")).toBeVisible();
});

test("a person can be added inline and is selected", async ({ page }) => {
  const person = `Inline Person ${Date.now().toString(36)}`;
  await page.goto("/projects/new");
  await page.getByLabel("Name", { exact: true }).fill(person);
  await page.getByRole("button", { name: "Add person", exact: true }).click();

  await expect(page.getByRole("combobox", { name: "Lead designer", exact: true })).toHaveValue(/^[a-f0-9]{24}$/);
  await expect(page.getByRole("combobox", { name: "Lead designer", exact: true }).locator("option:checked")).toHaveText(person);

  await page.getByLabel("Name", { exact: true }).fill("sara malik");
  await page.getByRole("button", { name: "Add person", exact: true }).click();
  await expect(page.getByText("Sara Malik was already listed, so they're selected.")).toBeVisible();
});
