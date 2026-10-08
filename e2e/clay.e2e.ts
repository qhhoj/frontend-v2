import { profile } from '../src/test/fixtures';
import { THEMES } from '../src/theme/registry';
import { expect, test } from './fixtures/api';
import { expectSameColour } from './fixtures/glass-probe';

/** A probe element carrying the `glass` surface class, next to one painted with the opaque fallback token. */
const measureGlassCard = () => {
  const probe = document.createElement('div');
  probe.className = 'glass';
  const solid = document.createElement('div');
  solid.style.backgroundColor = 'var(--qh-surface-solid)';
  document.body.append(probe, solid);
  const result = {
    fill: getComputedStyle(probe).backgroundColor,
    solid: getComputedStyle(solid).backgroundColor,
    blur: getComputedStyle(probe).backdropFilter,
  };
  probe.remove();
  solid.remove();
  return result;
};

for (const theme of THEMES.filter((entry) => !entry.glass)) {
  test.describe(`${theme.id}: flat rendering`, () => {
    test.beforeEach(async ({ page, api }) => {
      void api;
      await page.emulateMedia({ colorScheme: theme.scheme });
      await page.addInitScript((id) => localStorage.setItem('qhhoj.theme', id), theme.id);
      await page.goto('/blog');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme.id);
    });

    test('a glass card is the opaque fallback colour with no blur', async ({ page }) => {
      const look = await page.evaluate(measureGlassCard);
      expectSameColour(look.fill, look.solid);
      expect(look.blur).toMatch(/^(none|blur\(0px\))$/);
    });

    test('no background blob is shown', async ({ page }) => {
      await expect(page.locator('.blob-field')).toBeHidden();
      const laidOut = await page.evaluate(
        () =>
          [...document.querySelectorAll('.blob-1, .blob-2, .blob-3')].filter(
            (blob) => blob.getBoundingClientRect().width > 0,
          ).length,
      );
      expect(laidOut).toBe(0);
    });

    test('the header call to action is one solid accent colour, not a gradient', async ({
      page,
    }) => {
      const cta = page.getByRole('banner').getByRole('link', { name: 'Đăng ký' });
      const look = await cta.evaluate((element) => {
        const swatch = document.createElement('div');
        swatch.style.color = 'var(--qh-accent)';
        document.body.append(swatch);
        const accent = getComputedStyle(swatch).color;
        swatch.remove();
        const style = getComputedStyle(element);
        return { image: style.backgroundImage, accent, text: style.color };
      });
      const stops = look.image.match(/rgb\([^)]+\)/g) ?? [];
      expect(stops.length).toBeGreaterThanOrEqual(2);
      expect(new Set(stops)).toEqual(new Set([look.accent]));
    });
  });
}

test.describe('Glass is unchanged', () => {
  test('a glass card blurs what is behind it and shows the blobs', async ({ page, api }) => {
    void api;
    await page.addInitScript(() => localStorage.setItem('qhhoj.theme', 'glass-dark'));
    await page.goto('/blog');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'glass-dark');
    const look = await page.evaluate(measureGlassCard);
    expect(look.blur).toMatch(/^blur\([1-9]\d*px\)$/);
    expect(look.fill).not.toBe(look.solid);
    await expect(page.locator('.blob-field')).toBeVisible();
  });
});

test.describe('a signed-in reload', () => {
  test('keeps the painted theme with no flash when the account theme differs from the local one', async ({
    page,
    api,
  }) => {
    api.signedIn = true;
    api.routes['GET /profile'] = { body: { data: profile({ siteTheme: 'glass-dark' }) } };
    await page.addInitScript(() => {
      // The browser's own choice is Clay; the last painted theme came from the account.
      localStorage.setItem('qhhoj.theme', 'clay-light');
      localStorage.setItem('qhhoj.resolvedTheme', 'glass-dark');
      localStorage.setItem('qhhoj.resolvedBy', 'account');
      const painted: (string | null)[] = [];
      (window as unknown as { painted: unknown }).painted = painted;
      // `documentElement` does not exist yet when init scripts run; observe the document.
      // Each record's old value is a theme that was on screen, even when records are batched.
      new MutationObserver((records) =>
        painted.push(...records.map((record) => record.oldValue)),
      ).observe(document, {
        subtree: true,
        attributes: true,
        attributeOldValue: true,
        attributeFilter: ['data-theme'],
      });
    });
    await page.goto('/blog');
    await page.reload();
    await expect(
      page.getByRole('banner').getByRole('button', { name: 'Giao diện', exact: true }),
    ).toBeVisible();
    await page.waitForLoadState('networkidle');
    const themes = await page.evaluate(() => {
      const { painted } = window as unknown as { painted: (string | null)[] };
      return [...painted, document.documentElement.dataset.theme].filter(Boolean);
    });
    expect(new Set(themes)).toEqual(new Set(['glass-dark']));
  });
});

test.describe('an anonymous auto visitor', () => {
  test('whose last visit painted dark loads with the OS now light and only ever paints light', async ({
    page,
    api,
  }) => {
    void api;
    await page.emulateMedia({ colorScheme: 'light' });
    await page.addInitScript(() => {
      localStorage.setItem('qhhoj.resolvedTheme', 'clay-dark');
      localStorage.setItem('qhhoj.resolvedBy', 'local');
      const painted: (string | null)[] = [];
      (window as unknown as { painted: unknown }).painted = painted;
      new MutationObserver((records) =>
        painted.push(...records.map((record) => record.oldValue)),
      ).observe(document, {
        subtree: true,
        attributes: true,
        attributeOldValue: true,
        attributeFilter: ['data-theme'],
      });
    });
    await page.goto('/blog');
    await expect(
      page.getByRole('banner').getByRole('button', { name: 'Giao diện', exact: true }),
    ).toBeVisible();
    await page.waitForLoadState('networkidle');
    const themes = await page.evaluate(() => {
      const { painted } = window as unknown as { painted: (string | null)[] };
      return [...painted, document.documentElement.dataset.theme].filter(Boolean);
    });
    expect(new Set(themes)).toEqual(new Set(['clay-light']));
  });
});
