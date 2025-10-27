import { test, expect } from '@playwright/test';

test('Home page loads and shows header', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/community cleanups/i)).toBeVisible();
});