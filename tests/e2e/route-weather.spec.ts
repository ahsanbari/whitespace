import { test, expect } from '@playwright/test';

test.describe('Route and Weather Popups', () => {
  test('Searching for a flight and clicking destination airport shows weather popup', async ({ page }) => {
    await page.goto('/');
    // Run the flight search for '8C3445'
    await page.waitForSelector('[data-testid="flight-search-input"]', { timeout: 10000 });
    const searchInput = page.getByTestId('flight-search-input');
    await searchInput.fill('WN5117');
    const showRouteButton = page.getByRole('button', { name: /show route/i });
    await showRouteButton.click();
    // Wait for the route legend to appear
    await page.waitForSelector('[data-testid="flight-route-legend"]', { timeout: 10000 });
    // Click the destination airport div (scroll into view first for Safari)
    await page.waitForSelector('div.airport-destination', { timeout: 10000 });
    const dest = page.locator('div.airport-destination');
    await dest.scrollIntoViewIfNeeded();
    await dest.click();
    // Wait for the weather popup
    await page.waitForSelector('[data-testid="weather-popup"]', { timeout: 10000 });
    await expect(page.getByTestId('weather-popup')).toBeVisible();
  });
}); 