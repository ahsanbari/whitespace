import { test, expect } from '@playwright/test';

test.describe('Map Smoke Test', () => {
  test('Map container and heatmap layer are present', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="map-container"]', { timeout: 15000 });
    await expect(page.getByTestId('map-container')).toBeVisible();
    // Wait for the heatmap canvas to appear
    await page.waitForSelector('canvas.leaflet-heatmap-layer', { timeout: 15000 });
    await expect(page.locator('canvas.leaflet-heatmap-layer')).toBeVisible();
  });
}); 