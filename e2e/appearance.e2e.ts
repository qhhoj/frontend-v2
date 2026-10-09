import type { Page } from '@playwright/test';
import { profile } from '../src/test/fixtures';
import type { AccentId, Appearance } from '../src/theme/appearance';
import { THEMES } from '../src/theme/registry';
import { expect, test } from './fixtures/api';
import { applyTheme, AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { expectSameColour, readGlass } from './fixtures/glass-probe';

const TRIGGER = { name: 'Giao diện', exact: true } as const;
const READY = 'Dùng giao diện riêng';
const themeNamed = (id: string) => THEMES.find((theme) => theme.id === id)!;
/** The worst case for contrast: the most see-through glass and the strongest blobs. */
const worstLook = (accent: AccentId): Appearance => ({ accent, glass: 0, glow: 100 });
/**
 * Per theme, the preset with the lowest accent contrast other than the theme's own, from the `themes.spec.ts` model
 * (on-accent on the fills, accent text, focus ring, soft text over every ground at every Glass level). Axe checks the
 * own preset and this one; the unit loop holds all 28 to the same rules.
 */
const LOWEST_CONTRAST_ACCENT: Record<string, AccentId> = {
  'clay-light': 'gold',
  'clay-dark': 'sunset',
  'glass-light': 'gold',
  'glass-dark': 'sunset',
};

/** Starts every page of the test with this look remembered in the browser (and painted by the pre-paint script). */
const rememberLook = (page: Page, look: Appearance) =>
  page.addInitScript((stored) => {
    localStorage.setItem('qhhoj.appearance', stored);
    localStorage.setItem('qhhoj.paintedAppearance', stored);
  }, JSON.stringify(look));

const openPanel = async (page: Page) => {
  await page.getByRole('button', TRIGGER).click();
  const panel = page.getByRole('dialog', { name: 'Giao diện' });
  await expect(panel).toBeVisible();
  return panel;
};

test('an anonymous visitor picks a look in the panel; it survives a reload and needs no account', async ({
  page,
  api,
}) => {
  // Glass and Glow only act on a Glass theme, so this flow starts on one.
  await applyTheme(page, api, themeNamed('glass-dark'));
  await page.goto('/blog');
  const panel = await openPanel(page);
  await panel.getByRole('button', { name: 'Sunset' }).click();
  await panel.getByRole('button', { name: 'Đặc' }).click();
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-accent', 'sunset');
  await expect(panel.getByRole('button', { name: 'Sunset' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(panel.getByRole('button', { name: 'Đặc' })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(html).toHaveAttribute('data-accent', 'sunset');
  const look = await readGlass(page);
  expectSameColour(look.fill, look.solid);
  expect(look.blur).toBe('blur(0px)');
  expect(api.requestsTo('PATCH /profile')).toEqual([]);
});

test('"use site default" clears the look and puts the mode back to Clay, automatic', async ({
  page,
  api,
}) => {
  void api;
  await page.goto('/blog');
  const panel = await openPanel(page);
  await panel.getByRole('button', { name: 'Mint' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-accent', 'mint');
  await panel.getByRole('button', { name: 'Dùng mặc định của trang' }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-accent', /.+/);
  await expect(
    panel.getByRole('group', { name: 'Kiểu' }).getByRole('button', { name: 'Clay', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    panel
      .getByRole('group', { name: 'Chế độ', exact: true })
      .getByRole('button', { name: 'Tự động' }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('picking a mode in the panel changes the theme and leaves the look off', async ({
  page,
  api,
}) => {
  api.signedIn = true;
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/blog');
  const panel = await openPanel(page);
  await panel.getByRole('button', { name: 'Glass', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'glass-light');
  await expect(page.locator('html')).not.toHaveAttribute('data-accent', /.+/);
  await expect
    .poll(() =>
      api.requestsTo('PATCH /profile').map((request) => JSON.parse(String(request.postData))),
    )
    .toEqual([{ siteTheme: 'glass-auto' }]);
});

test('in a Clay theme the Glass and Glow controls are disabled with a reason, and the accent still works', async ({
  page,
  api,
}) => {
  await applyTheme(page, api, themeNamed('clay-light'));
  await page.goto('/settings/appearance');
  await expect(page.getByText(READY, { exact: true })).toBeVisible();
  await page.getByRole('switch', { name: READY }).click();
  await expect(page.locator('#glass-level')).toBeDisabled();
  await expect(page.locator('#glow-level')).toBeDisabled();
  await expect(
    page.getByText('Glass và quầng sáng chỉ áp dụng cho giao diện Glass.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Ocean' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-accent', 'ocean');
  const look = await readGlass(page);
  expectSameColour(look.fill, look.solid);
  expect(look.blur).toBe('blur(0px)');
});

test('the panel and the settings page show the same look, and the page takes focus', async ({
  page,
  api,
}) => {
  void api;
  await page.goto('/blog');
  const panel = await openPanel(page);
  await panel.getByRole('button', { name: 'Mint' }).click();
  await panel.getByRole('link', { name: 'Thêm trong Cài đặt' }).click();
  await expect(page).toHaveURL(/\/settings\/appearance$/);
  // The router focuses #main on a new page; closing the popover by a link must not pull focus back to the button.
  await expect(page.locator('#main')).toBeFocused();
  await expect(page.getByRole('switch', { name: READY })).toBeChecked();
  await expect(page.getByRole('button', { name: 'Mint' })).toHaveAttribute('aria-pressed', 'true');
});

test('a signed-in look is read from the account and saved there', async ({ page, api }) => {
  api.signedIn = true;
  const saved: unknown[] = [];
  api.routes['GET /profile'] = {
    body: { data: profile({ appearance: { accent: 'ocean', glass: 40, glow: 60 } }) },
  };
  api.routes['PATCH /profile'] = ({ body }) => {
    saved.push(body);
    return { body: { data: profile(body as object) } };
  };
  await rememberLook(page, { accent: 'mint', glass: 0, glow: 100 });
  await page.goto('/blog');
  await expect(page.locator('html')).toHaveAttribute('data-accent', 'ocean');
  const panel = await openPanel(page);
  await panel.getByRole('button', { name: 'Gold' }).click();
  await expect.poll(() => saved).toEqual([{ appearance: { accent: 'gold', glass: 40, glow: 60 } }]);
});

test('a device that asks for less transparency gets solid cards whatever the slider says', async ({
  page,
  api,
}) => {
  void api;
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
  });
  // Not applyTheme: its emulateMedia call could replace the CDP media features, so the anonymous browser preference picks the Glass theme.
  await page.addInitScript(() => localStorage.setItem('qhhoj.theme', 'glass-dark'));
  await rememberLook(page, worstLook('orchid'));
  await page.goto('/settings/appearance');
  const supported = await page.evaluate(
    () => matchMedia('(prefers-reduced-transparency: reduce)').matches,
  );
  test.skip(!supported, 'this Chromium build does not know prefers-reduced-transparency');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'glass-dark');
  await expect(page.getByText(READY, { exact: true })).toBeVisible();
  const look = await readGlass(page);
  expectSameColour(look.fill, look.solid);
  expect(look.blur).toBe('blur(0px)');
  await expect(page.locator('#glass-level')).toBeDisabled();
  await expect(page.getByText('Thiết bị của bạn yêu cầu giảm độ trong suốt')).toBeVisible();
});

test('every control in the panel is at least 44 px', async ({ page, api }) => {
  void api;
  await page.goto('/blog');
  const panel = await openPanel(page);
  const targets = panel.locator('button, a');
  const sizes = await targets.evaluateAll((elements) =>
    elements.map((element) => {
      const { width, height } = element.getBoundingClientRect();
      return {
        name: element.textContent?.trim() || element.getAttribute('aria-label'),
        width,
        height,
      };
    }),
  );
  // Style 2 + Mode 3 + accents 7 + Glass 3 + use site default + the link.
  expect(sizes.length).toBeGreaterThanOrEqual(17);
  expect(sizes.filter((size) => size.height < 44 || size.width < 44)).toEqual([]);
});

for (const theme of THEMES)
  for (const accent of [theme.accent, LOWEST_CONTRAST_ACCENT[theme.id]]) {
    test(`the appearance page has no WCAG A/AA violations in ${theme.id} with ${accent} at glass 0, glow 100`, async ({
      page,
      api,
    }) => {
      await applyTheme(page, api, theme);
      await rememberLook(page, worstLook(accent));
      await page.goto('/settings/appearance');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme.id);
      await expect(page.getByText(READY, { exact: true })).toBeVisible();
      expect(await axeViolationsIn(page)).toEqual([]);
    });

    test(`the open appearance panel has no WCAG A/AA violations in ${theme.id} with ${accent} at glass 0, glow 100`, async ({
      page,
      api,
    }) => {
      await applyTheme(page, api, theme);
      await rememberLook(page, worstLook(accent));
      await page.goto('/blog');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme.id);
      await openPanel(page);
      expect(await axeViolationsIn(page)).toEqual([]);
    });
  }

const phone = AUDIT_VIEWPORTS.find((viewport) => viewport.width === 375)!;
test.describe(`at ${phone.name}`, () => {
  test.use({ viewport: { width: phone.width, height: phone.height } });
  const horizontalScroll = (page: Page) =>
    page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

  for (const theme of THEMES) {
    test(`the page and the open panel fit and pass axe in ${theme.id}`, async ({ page, api }) => {
      await applyTheme(page, api, theme);
      await rememberLook(page, worstLook(LOWEST_CONTRAST_ACCENT[theme.id]));
      await page.goto('/settings/appearance');
      await expect(page.getByText(READY, { exact: true })).toBeVisible();
      expect(await horizontalScroll(page)).toBeLessThanOrEqual(0);
      expect(await axeViolationsIn(page)).toEqual([]);
      const panel = await openPanel(page);
      const box = (await panel.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(phone.width);
      expect(await horizontalScroll(page)).toBeLessThanOrEqual(0);
      expect(await axeViolationsIn(page)).toEqual([]);
    });
  }
});
