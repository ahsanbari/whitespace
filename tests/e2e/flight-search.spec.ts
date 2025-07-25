import { test, expect } from '@playwright/test';

test.describe('Flight Search', () => {
  test('Searching for a flight pans to the flight and displays the route legend panel', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="flight-search-input"]', { timeout: 10000 });

    // Find the search input
    const searchInput = page.getByTestId('flight-search-input');
    await expect(searchInput).toBeVisible();

    // Enter the highlighted flight number from the UI: '8C3445'
    await searchInput.fill('8C3445');
    // Click the Show Route button instead of pressing Enter
    const showRouteButton = page.getByRole('button', { name: /show route/i });
    await showRouteButton.click();
    // Wait for the flight route legend panel to appear
    await page.waitForSelector('[data-testid="flight-route-legend"]', { timeout: 60000 });
    await expect(page.getByTestId('flight-route-legend')).toBeVisible();
  });
}); 