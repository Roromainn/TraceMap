import { test, expect } from '@playwright/test';

// Assumes Expo web server is running at baseURL (http://localhost:19006)
test('FAB navigates to recording screen when pressed', async ({ page }) => {
  // Navigate to the root, could be "/" or "/index.html" depending on setup
  await page.goto('/');
  // Wait for the FAB to appear (testID maps to data-testid on web)
  const fab = page.locator('[data-testid="fab-add"]');
  await fab.waitFor({ state: 'visible', timeout: 10000 });
  await fab.click();
  // Expect navigation to the recording screen path
  await expect(page).toHaveURL(/record/);
});
