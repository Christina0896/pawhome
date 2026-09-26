import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Find your next')).toBeVisible();
  await expect(page.getByText('Search')).toBeVisible();
});

test('header links are visible', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Shelters').first()).toBeVisible();
  await expect(page.getByText('Breed Guide').first()).toBeVisible();
  await expect(page.getByText('About Us').first()).toBeVisible();
  await expect(page.getByText(/Contact|Contact Us/i).first()).toBeVisible();
});

test('registration only offers supported account types', async ({ page }) => {
  await page.goto('/register');

  const accountType = page.locator('select[name="accountType"]');
  await expect(accountType).toBeVisible();
  await expect(accountType.locator('option')).toHaveText([
    'Select account type',
    'Buyer',
    'Private Seller',
    'Breeder',
  ]);
  await expect(accountType.locator('option[value="Shelter / Rescue"]')).toHaveCount(0);
});

test('logged out users are blocked from the post ad form', async ({ page }) => {
  await page.goto('/post-ad');

  await expect(page.getByRole('heading', { name: 'Log in to post an ad' })).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible();
  await expect(page.getByRole('main').getByRole('link', { name: 'Register' })).toBeVisible();
});
