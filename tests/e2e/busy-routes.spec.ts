import { test, expect } from '@playwright/test';

test.describe('Busy Routes Panel', () => {
  test('Panel renders and lists busy routes', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="busy-routes-panel"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="busy-route-row"]', { timeout: 10000 });
    await expect(page.getByTestId('busy-routes-panel')).toBeVisible();
    await expect(page.getByTestId('busy-route-row').first()).toBeVisible();
  });

  test('Clicking a route opens the flight route legend panel', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="busy-route-row"]', { timeout: 10000 });
    const routeRow = page.getByTestId('busy-route-row').first();
    await routeRow.scrollIntoViewIfNeeded();
    await routeRow.click();
    await page.waitForSelector('[data-testid="flight-route-legend"]', { timeout: 10000 });
    await expect(page.getByTestId('flight-route-legend')).toBeVisible();
  });
}); 