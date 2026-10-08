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

for (const path of ['/', '/problems', '/contests/r42/ranking', '/login', '/blog'])
  test(`${path} does not scroll sideways at 375 px`, async ({ page, api }) => {
    api.signedIn = path !== '/login';
    await page.goto(path);
    await page.waitForLoadState('networkidle');
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
  const tools = (await page.getByRole('button', { name: 'Đổi giao diện' }).boundingBox())!;
  const account = (await page.getByRole('button', { name: /Tài khoản của/ }).boundingBox())!;
  expect(nav.y).toBeGreaterThanOrEqual(brand.y + brand.height);
  expect(nav.x + nav.width).toBeLessThanOrEqual(PHONE.width);
  expect(tools.x).toBeGreaterThanOrEqual(brand.x + brand.width);
  expect(account.x + account.width).toBeLessThanOrEqual(PHONE.width);
  expect(await horizontalPageScroll(page)).toBeLessThanOrEqual(0);
});

test('the nav pill scrolls on its own and cuts an item off as the "more" cue', async ({
  page,
  api,
}) => {
  void api;
  await page.goto('/blog');
  const nav = page.getByRole('navigation', { name: 'Điều hướng chính' });
  const state = await nav.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const links = [...element.querySelectorAll('a')].map((link) => link.getBoundingClientRect());
    return {
      scrolls: element.scrollWidth > element.clientWidth,
      cutOff: links.some((rect) => rect.left < bounds.right && rect.right > bounds.right),
    };
  });
  expect(state.scrolls).toBe(true);
  expect(state.cutOff, 'a half-visible item tells the viewer there is more').toBe(true);
  await nav.getByRole('link', { name: 'Blog' }).focus();
  const last = (await nav.getByRole('link', { name: 'Blog' }).boundingBox())!;
  const pill = (await nav.boundingBox())!;
  expect(last.x + last.width, 'a focused item scrolls fully into view').toBeLessThanOrEqual(
    pill.x + pill.width + 1,
  );
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
    await page.waitForLoadState('networkidle');
    const region = page.getByRole('region', { name: label });
    await expect(region).toBeVisible();
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
