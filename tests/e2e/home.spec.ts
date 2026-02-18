import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('page loads with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/AI Website Builder/);
  });

  test('hero section is visible', async ({ page }) => {
    await page.goto('/');
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Build Websites');
  });

  test('CTA buttons are present', async ({ page }) => {
    await page.goto('/');
    const getStartedLink = page.locator('a', { hasText: 'Get Started' });
    await expect(getStartedLink).toBeVisible();
  });

  test('features section is visible', async ({ page }) => {
    await page.goto('/');
    const featuresHeading = page.locator('h2', {
      hasText: 'Everything You Need',
    });
    await expect(featuresHeading).toBeVisible();
  });
});
