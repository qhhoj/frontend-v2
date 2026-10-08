import { THEMES } from '../src/theme/registry';
import { expect, test } from './fixtures/api';
import { applyTheme } from './fixtures/audit';
import { channelsOf, expectSameColour, readGlass } from './fixtures/glass-probe';

for (const theme of THEMES.filter((entry) => entry.glass)) {
  test.describe(`${theme.id}: glass and glow tokens`, () => {
    test.beforeEach(async ({ page, api }) => {
      await applyTheme(page, api, theme);
      await page.goto('/blog');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme.id);
    });

    test('with nothing set, glass is the theme surface and the 24 px blur', async ({ page }) => {
      const look = await readGlass(page);
      expectSameColour(look.fill, look.siteSurface);
      expect(look.blur).toBe('blur(24px)');
    });

    test('glass 100 is the opaque fallback with no blur', async ({ page }) => {
      await page.evaluate(() => document.documentElement.style.setProperty('--qh-glass', '100'));
      const look = await readGlass(page);
      expectSameColour(look.fill, look.solid);
      expect(look.blur).toBe('blur(0px)');
    });

    test('glass 50 blurs half as much and is more opaque than Clear', async ({ page }) => {
      const clear = await readGlass(page);
      await page.evaluate(() => document.documentElement.style.setProperty('--qh-glass', '50'));
      const frosted = await readGlass(page);
      expect(frosted.blur).toBe('blur(12px)');
      expect(channelsOf(frosted.fill)[3]).toBeGreaterThan(channelsOf(clear.fill)[3]);
      expect(channelsOf(frosted.fill)[3]).toBeLessThan(1);
    });

    test('glow scales the whole blob layer, and 100 is the site look', async ({ page }) => {
      const blobs = page.locator('.blob-field');
      await expect(blobs).toHaveCSS('opacity', '1');
      await page.evaluate(() =>
        document.documentElement.style.setProperty('--qh-blob-strength', '0.35'),
      );
      await expect(blobs).toHaveCSS('opacity', '0.35');
    });
  });
}

for (const theme of THEMES.filter((entry) => !entry.glass)) {
  test.describe(`${theme.id}: glass and glow levels change nothing`, () => {
    test.beforeEach(async ({ page, api }) => {
      await applyTheme(page, api, theme);
      await page.goto('/blog');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme.id);
    });

    test('a stored glass 0, 50 or 100 leaves the card opaque and unblurred', async ({ page }) => {
      for (const level of ['0', '50', '100']) {
        await page.evaluate(
          (value) => document.documentElement.style.setProperty('--qh-glass', value),
          level,
        );
        const look = await readGlass(page);
        expectSameColour(look.fill, look.solid);
        expect(look.blur).toBe('blur(0px)');
      }
    });

    test('glow 100 shows no blob', async ({ page }) => {
      await page.evaluate(() =>
        document.documentElement.style.setProperty('--qh-blob-strength', '1'),
      );
      await expect(page.locator('.blob-field')).toBeHidden();
    });
  });
}
