import { test, expect } from 'playwright/test';

test.describe('pausa', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.getByRole('button', { name: 'Jugar' }).click();
    await expect(page.locator('#menu-principal')).toHaveCount(0);
  });

  test('alterna pausa con Escape', async ({ page }) => {
    await page.keyboard.press('Escape');
    await expect(page.locator('#pause-overlay')).toBeVisible();
    await expect.poll(async () => page.evaluate(() => window.__debugJump?.pausado ?? null)).toBe(true);

    await page.keyboard.press('Escape');
    await expect(page.locator('#pause-overlay')).toBeHidden();
    await expect.poll(async () => page.evaluate(() => window.__debugJump?.pausado ?? null)).toBe(false);
  });
});
