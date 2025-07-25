import { test, expect } from '@playwright/test';

test.describe('Map Controls', () => {
  test('Controls panel and toggles are visible and interactable', async ({ page }) => {
    await page.goto('/');
    // Open the controls panel by clicking the settings button (Cog icon)
    // The button has class 'map-control__settings-btn' and title 'Map Layer Settings'
    const settingsButton = page.locator('button.map-control__settings-btn[title="Map Layer Settings"]');
    await settingsButton.click();
    // Wait for the controls panel toggles to appear
    await page.waitForSelector('[data-testid="toggle-heatmap"]', { timeout: 20000 });
    await page.waitForSelector('[data-testid="toggle-markers"]', { timeout: 20000 });
    await page.waitForSelector('[data-testid="toggle-clustering"]', { timeout: 20000 });
    await page.waitForSelector('[data-testid="toggle-webgl"]', { timeout: 20000 });
    await page.waitForSelector('[data-testid="marker-limit-input"]', { timeout: 20000 });

    // Assert that all controls are visible
    await expect(page.getByTestId('toggle-heatmap')).toBeVisible();
    await expect(page.getByTestId('toggle-markers')).toBeVisible();
    await expect(page.getByTestId('toggle-clustering')).toBeVisible();
    await expect(page.getByTestId('toggle-webgl')).toBeVisible();
    await expect(page.getByTestId('marker-limit-input')).toBeVisible();
  });
}); 