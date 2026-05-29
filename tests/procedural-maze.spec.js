import { test, expect } from 'playwright/test';

test.describe('maze procedural', () => {
  test('genera meta y multiples rutas', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await expect(page.locator('#loading-overlay')).toBeVisible();
    await expect(page.locator('#menu-principal')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('#loading-overlay')).toBeHidden();

    const level = await page.evaluate(() => ({
      seed: window.__debugJump?.levelSeed,
      size: window.__debugJump?.maze?.length,
      startCell: window.__debugJump?.startCell,
      endCell: window.__debugJump?.endCell,
      routeCount: window.__debugJump?.routeCount,
    }));

    expect(level.seed).toBeTruthy();
    expect(level.size).toBe(29);
    expect(level.startCell).toEqual({ gx: 1, gz: 1 });
    expect(level.endCell).toEqual(expect.objectContaining({
      gx: expect.any(Number),
      gz: expect.any(Number),
    }));
    expect(level.routeCount).toBeGreaterThanOrEqual(2);
  });

  test('genera un nuevo maze al llegar a la meta', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await expect(page.locator('#menu-principal')).toBeVisible({ timeout: 30000 });
    await page.getByRole('button', { name: 'Jugar' }).click();
    await expect(page.locator('#menu-principal')).toHaveCount(0);

    const seedInicial = await page.evaluate(() => window.__debugJump?.levelSeed);
    await expect.poll(async () => page.evaluate(() => window.__debugJump?.nextLevelReady), {
      timeout: 15000,
    }).toBe(true);
    await page.evaluate(() => window.__debugJump?.teleportToEnd());

    await expect.poll(async () => page.evaluate(() => window.__debugJump?.levelSeed), {
      timeout: 7000,
    }).not.toBe(seedInicial);

    await expect.poll(async () => page.locator('#hud-tiempo').textContent()).toMatch(/^00:0[0-3]\./);
    await expect.poll(async () => page.evaluate(() => window.__debugJump?.routeCount ?? 0)).toBeGreaterThanOrEqual(2);
  });
});
