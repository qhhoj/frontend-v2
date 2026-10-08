import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures/api';

const PHONE = { width: 375, height: 812 };
test.use({ viewport: PHONE });

const horizontalPageScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

/** Descendants whose box pokes out of `container` sideways (sub-pixel rounding tolerated). */
const overflowingChildren = (container: Locator) =>
  container.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return [...element.querySelectorAll('*')]
      .filter((child) => {
        const rect = child.getBoundingClientRect();
        return rect.width > 0 && (rect.left < bounds.left - 1 || rect.right > bounds.right + 1);
      })
      .map(
        (child) =>
          `${child.tagName.toLowerCase()}.${String(child.getAttribute('class')).slice(0, 40)}`,
      );
  });

/** `ready` is text that only shows once the page has left its loading state. */
const PAGES = [
  { path: '/', signedIn: true, ready: 'Tổng hai số' },
  { path: '/problems', signedIn: true, ready: 'Chọn bài, bắt đầu giải' },
  { path: '/contests/r42/ranking', signedIn: true, ready: 'QHH Round #42 (Div. 2)' },
  { path: '/login', signedIn: false, ready: 'Đăng nhập' },
  { path: '/blog', signedIn: true, ready: 'Blog' },
  { path: '/problems/duongdi', signedIn: true, ready: 'Thời gian' },
  { path: '/submissions', signedIn: true, ready: 'Tổng hai số' },
  { path: '/submissions/sub-1', signedIn: true, ready: 'Kết quả từng test' },
  { path: '/settings/appearance', signedIn: false, ready: 'Dùng giao diện riêng' },
] as const;

for (const { path, signedIn, ready } of PAGES)
  test(`${path} does not scroll sideways at 375 px`, async ({ page, api }) => {
    api.signedIn = signedIn;
    await page.goto(path);
    await expect(page.getByText(ready, { exact: true }).first()).toBeVisible();
    expect(await horizontalPageScroll(page)).toBeLessThanOrEqual(0);
  });

test('the header stacks: brand, then the nav pill, with the tools beside the brand', async ({
  page,
  api,
}) => {
  api.signedIn = true;
  await page.goto('/blog');
  const brand = (await page.getByRole('link', { name: 'QHHOJ' }).first().boundingBox())!;
  const nav = (await page.getByRole('navigation', { name: 'Điều hướng chính' }).boundingBox())!;
  const tools = (await page.getByRole('button', { name: 'Giao diện', exact: true }).boundingBox())!;
  const account = (await page.getByRole('button', { name: /Tài khoản của/ }).boundingBox())!;
  expect(nav.y).toBeGreaterThanOrEqual(brand.y + brand.height);
  expect(nav.x + nav.width).toBeLessThanOrEqual(PHONE.width);
  expect(tools.x).toBeGreaterThanOrEqual(brand.x + brand.width);
  expect(account.x + account.width).toBeLessThanOrEqual(PHONE.width);
  expect(await horizontalPageScroll(page)).toBeLessThanOrEqual(0);
});

const NAV_NAME = 'Điều hướng chính';

test('the nav pill shows every item inside the viewport at 375 px', async ({ page, api }) => {
  void api;
  await page.goto('/blog');
  const nav = page.getByRole('navigation', { name: NAV_NAME });
  const pill = (await nav.boundingBox())!;
  for (const link of await nav.getByRole('link').all()) {
    const box = (await link.boundingBox())!;
    expect(box.x, await link.innerText()).toBeGreaterThanOrEqual(pill.x);
    expect(box.x + box.width, await link.innerText()).toBeLessThanOrEqual(pill.x + pill.width + 1);
  }
  expect(await horizontalPageScroll(page)).toBeLessThanOrEqual(0);
});

for (const { locale, navName } of [
  { locale: 'vi', navName: NAV_NAME },
  { locale: 'en', navName: 'Main navigation' },
])
  for (const width of [375, 320])
    test(`the ${locale} nav pill reaches its last item and never widens the page at ${width} px`, async ({
      page,
      api,
    }) => {
      void api;
      await page.addInitScript((value) => localStorage.setItem('qhhoj.locale', value), locale);
      await page.setViewportSize({ width, height: PHONE.height });
      await page.goto('/blog');
      const nav = page.getByRole('navigation', { name: navName });
      await nav.getByRole('link', { name: 'Blog' }).focus();
      const last = (await nav.getByRole('link', { name: 'Blog' }).boundingBox())!;
      const pill = (await nav.boundingBox())!;
      expect(last.x + last.width, 'a focused item scrolls fully into view').toBeLessThanOrEqual(
        pill.x + pill.width + 1,
      );
      expect(await horizontalPageScroll(page)).toBeLessThanOrEqual(0);
    });

test('at 320 px the nav pill scrolls on its own', async ({ page, api }) => {
  void api;
  await page.setViewportSize({ width: 320, height: PHONE.height });
  await page.goto('/blog');
  const nav = page.getByRole('navigation', { name: NAV_NAME });
  expect(await nav.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
});

test('home: recent submissions and the rating hero fit and keep their text readable', async ({
  page,
  api,
}) => {
  api.signedIn = true;
  await page.goto('/');
  const recent = page.getByTestId('recent-submissions');
  const hero = page.getByTestId('rating-hero');
  await expect(recent.getByText('Tổng hai số')).toBeVisible();
  await expect(hero.getByText('2104')).toBeVisible();
  expect(await overflowingChildren(recent)).toEqual([]);
  expect(await overflowingChildren(hero)).toEqual([]);
  const name = await recent.getByText('Tổng hai số').evaluate((element) => ({
    clipped: element.scrollWidth > element.clientWidth,
    width: element.getBoundingClientRect().width,
  }));
  expect(name.clipped, 'the problem name is not ellipsised').toBe(false);
  expect(name.width).toBeGreaterThan(100);
  const card = (await hero.boundingBox())!;
  expect(card.x + card.width).toBeLessThanOrEqual(PHONE.width);
  const tiles = await hero.locator('dl > div').evaluateAll((elements) =>
    elements.map((element) => ({
      width: element.getBoundingClientRect().width,
      overflows: element.scrollWidth > element.clientWidth,
    })),
  );
  expect(tiles.length).toBeGreaterThan(0);
  for (const tile of tiles) {
    expect(tile.overflows).toBe(false);
    expect(tile.width).toBeGreaterThan(80);
  }
});

for (const { path, name, label } of [
  { path: '/problems', name: 'problems', label: 'Bảng bài, cuộn ngang' },
  { path: '/contests/r42/ranking', name: 'ranking', label: 'Vùng cuộn bảng xếp hạng' },
])
  test(`${name}: the wide table scrolls inside a keyboard-reachable region with an inset focus ring`, async ({
    page,
    api,
  }) => {
    api.signedIn = true;
    await page.goto(path);
    const region = page.getByRole('region', { name: label });
    await expect(region).toBeVisible();
    await expect(region.getByRole('row').nth(1)).toBeVisible();
    expect(await region.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(
      true,
    );
    for (
      let presses = 0;
      presses < 40 && !(await region.evaluate((element) => element === document.activeElement));
      presses++
    )
      await page.keyboard.press('Tab');
    await expect(region).toBeFocused();
    const ring = await region.evaluate((element) => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return {
        style: style.outlineStyle,
        width: parseFloat(style.outlineWidth),
        offset: parseFloat(style.outlineOffset),
        colour: style.outlineColor,
        boxRight: box.right,
      };
    });
    expect(ring.style).toBe('solid');
    expect(ring.width).toBeGreaterThanOrEqual(2);
    expect(ring.offset, 'inset: the ring is drawn inside the box, not clipped by it').toBeLessThan(
      0,
    );
    expect(ring.colour).not.toBe('rgba(0, 0, 0, 0)');
    expect(ring.boxRight).toBeLessThanOrEqual(PHONE.width);
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => region.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  });

const SHEET_SUBMIT_HEIGHT_PX = 56;
const SHEET_DRAG_PX = 200;

test.describe('the problem page sheet and tabs at 375 px', () => {
  test.beforeEach(async ({ page, api }) => {
    api.signedIn = true;
    await page.goto('/problems/duongdi');
    await expect(page.locator('#main h1')).toBeVisible();
  });

  test('starts collapsed and gives the submit button a 56 px target', async ({ page }) => {
    await expect(page.getByRole('dialog', { name: 'Nộp bài' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Mở rộng' }).click();
    const submit = await page
      .getByRole('dialog', { name: 'Nộp bài' })
      .getByRole('button', { name: 'Nộp bài' })
      .boundingBox();
    expect(submit!.height).toBeGreaterThanOrEqual(SHEET_SUBMIT_HEIGHT_PX);
  });

  test('collapses when its handle is dragged down', async ({ page }) => {
    await page.getByRole('button', { name: 'Mở rộng' }).click();
    const sheet = page.getByRole('dialog', { name: 'Nộp bài' });
    const handle = (await sheet.locator('header .touch-none').boundingBox())!;
    const pointerX = handle.x + handle.width / 2;
    await page.mouse.move(pointerX, handle.y + handle.height / 2);
    await page.mouse.down();
    await page.mouse.move(pointerX, handle.y + SHEET_DRAG_PX, { steps: 8 });
    await page.mouse.up();
    await expect(sheet).toHaveCount(0);
  });

  test('keeps the tab strip inside the screen with touchable tabs', async ({ page }) => {
    for (const tab of await page.getByRole('tab').all()) {
      await tab.scrollIntoViewIfNeeded();
      const box = (await tab.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(PHONE.width);
    }
  });
});
