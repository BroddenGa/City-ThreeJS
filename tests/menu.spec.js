import { test, expect } from 'playwright/test';

test.describe('menu principal', () => {
  test.setTimeout(45000);

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
  });

  test('muestra controles e inicia el juego', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 're-maze' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Jugar' })).toBeVisible();

    const controles = page.getByRole('button', { name: 'Controles' });
    await controles.click();
    await expect(page.getByText('WASD - Moverse')).toBeVisible();
    await expect(page.getByText('Shift - Dash')).toBeVisible();

    await page.getByRole('button', { name: 'Jugar' }).click();
    await expect(page.locator('#menu-principal')).toHaveCount(0);
  });
});
