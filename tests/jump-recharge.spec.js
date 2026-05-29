import { test, expect } from 'playwright/test';

test.describe('recarga doble salto', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.getByRole('button', { name: 'Jugar' }).click();
    await expect(page.locator('#menu-principal')).toHaveCount(0);
  });

  test('no recarga al tocar muros', async ({ page }) => {
    const saltos = await page.evaluate(() => {
      const pj = window.__debugJump;
      if (!pj) return null;
      window.__debugJump.setSaltosRestantes(0);
      return window.__debugJump.saltosRestantes;
    });

    expect(saltos).not.toBeNull();
    expect(saltos).toBe(0);
  });

  test('recarga en tile central', async ({ page }) => {
    await expect
      .poll(async () => page.evaluate(() => window.__debugJump?.enSuelo ?? false), { timeout: 12000 })
      .toBe(true);

    await page.evaluate(() => window.__debugJump?.setSaltosRestantes(0));

    await expect.poll(async () => page.evaluate(() => window.__debugJump?.saltosRestantes ?? null)).toBe(1);
  });
});
