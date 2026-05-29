import { test, expect } from 'playwright/test';

test.describe('configuracion', () => {
  test.describe.configure({ timeout: 60000 });

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.evaluate(() => localStorage.removeItem('re-maze-mouse-sensitivity'));
    await page.reload();
  });

  test('guarda y restablece la sensibilidad del mouse', async ({ page }) => {
    await page.locator('#menu-config').click();
    await expect(page.locator('#config-overlay')).toBeVisible();

    await page.locator('#config-sensibilidad').evaluate((input) => {
      input.value = '3.1';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    await expect.poll(async () => page.evaluate(() => window.__debugJump?.sensibilidadMouse ?? null)).toBeCloseTo(0.0031, 5);
    await expect(page.locator('#config-sensibilidad-value')).toHaveText('3.1');

    await page.reload();
    await expect.poll(async () => page.evaluate(() => window.__debugJump?.sensibilidadMouse ?? null)).toBeCloseTo(0.0031, 5);
    await expect.poll(async () => page.evaluate(() => window.__debugJump?.perfilSensibilidadMouse ?? null)).toBe('personalizada');

    await page.locator('#menu-config').click();
    await page.getByRole('button', { name: 'Restablecer' }).click();

    await expect.poll(async () => page.evaluate(() => window.__debugJump?.sensibilidadMouse ?? null)).toBeCloseTo(0.0022, 5);
    await expect.poll(async () => page.evaluate(() => localStorage.getItem('re-maze-mouse-sensitivity'))).toBeNull();
  });
});
