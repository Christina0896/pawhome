import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('http://localhost:3000');

  await expect(page.getByText('Find your next')).toBeVisible();
  await expect(page.getByText('Search')).toBeVisible();
});

test('header links are visible', async ({ page }) => {
  await page.goto('http://localhost:3000');

  await expect(page.getByText('Shelters').first()).toBeVisible();
  await expect(page.getByText('Buying Safely').first()).toBeVisible();
  await expect(page.getByText('Breed Guide').first()).toBeVisible();
  await expect(page.getByText(/Contact|Contact Us/i).first()).toBeVisible();
});

test('post ad page responds', async ({ page }) => {
  await page.goto('http://localhost:3000/post-ad');

  await page.waitForLoadState('networkidle');

  await expect(page).toHaveURL(/\/post-ad|\/login|\/profile/);
});
