import { expect, test } from "@playwright/test";
test("login page does not contact Supabase directly", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("supabase.co")) external.push(request.url());
  });
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /JASTIPin/i })).toBeVisible();
  expect(external).toEqual([]);
});
