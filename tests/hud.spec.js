import { test, expect } from 'playwright/test';

test.describe('hud de partida', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem('re-maze-best-time'));
    await page.goto('http://localhost:5173/');
    await page.getByRole('button', { name: 'Jugar' }).click();
    await expect(page.locator('#menu-principal')).toHaveCount(0);
  });

  test('muestra cronometro e indicadores de estado', async ({ page }) => {
    await expect(page.locator('#hud-tiempo')).toBeVisible();
    await expect(page.locator('#hud-tiempo')).toHaveText(/\d{2}:\d{2}\.\d{2}/);
    await expect(page.locator('#hud-mejor')).toHaveText('--:--.--');
    await expect(page.locator('#hud-saltos')).toHaveText(/\d+\/\d+/);
    await expect(page.locator('#hud-dash')).toHaveText('LISTO');

    await expect.poll(async () => page.locator('#hud-tiempo').textContent()).not.toBe('00:00.00');
  });
});
