import { expect, test } from "@playwright/test";

test("login flow", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', "matheus@instituto-criativo.org");
  await page.fill('input[name="password"]', "12345678");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL("/");
});
