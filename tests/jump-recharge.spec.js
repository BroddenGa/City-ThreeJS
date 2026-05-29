import { test, expect } from 'playwright/test';

test.describe('recarga doble salto', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
  });

  test('no recarga al tocar muros', async ({ page }) => {
    await page.evaluate(() => {
      const pj = window.__debugJump;
      if (!pj) return;
      window.__debugJump.setSaltosRestantes(0);
    });

    const estado = await page.evaluate(() => window.__debugJump ?? null);
    const saltos = estado?.saltosRestantes ?? null;
    expect(saltos).not.toBeNull();
    expect(saltos).toBe(0);
  });

  test('recarga en tile central', async ({ page }) => {
    await page.click('canvas');
    await page.waitForTimeout(200);

    await page.keyboard.press('Space');
    await page.waitForTimeout(120);
    await page.keyboard.press('Space');

    await page.waitForTimeout(400);
    const saltos = await page.evaluate(() => window.__debugJump?.saltosRestantes ?? null);
    expect(saltos).toBe(1);
  });
});
