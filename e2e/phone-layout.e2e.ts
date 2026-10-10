import type { Page } from '@playwright/test';
import { CONTEST_FIXTURE_NOW, expect, test } from './fixtures/api';

const PHONE = { width: 375, height: 812 };
test.use({ viewport: PHONE });

const horizontalPageScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

/** `ready` is text that only shows once the page has left its loading state. */
const PAGES = [
  { path: '/', signedIn: true, ready: 'Tổng hai số' },
  { path: '/problems', signedIn: true, ready: 'Đường đi ngắn nhất' },
  { path: '/contests/r42/ranking', signedIn: true, ready: 'QHH Round #42 (Div. 2)' },
  { path: '/contests', signedIn: true, ready: 'QHH Round #42 (Div. 2)' },
  { path: '/contests/r42', signedIn: true, ready: 'QHH Round #42 (Div. 2)' },
  { path: '/contests/r42/announcements', signedIn: true, ready: 'Thông báo 1' },
  { path: '/contests/r42/stats', signedIn: true, ready: 'QHH Round #42 (Div. 2)' },
  { path: '/login', signedIn: false, ready: 'Đăng nhập' },
  { path: '/blog', signedIn: true, ready: 'Blog' },
  { path: '/problems/duongdi', signedIn: true, ready: 'Thời gian' },
  { path: '/submissions', signedIn: true, ready: 'Tổng hai số' },
  { path: '/submissions/sub-1', signedIn: true, ready: 'Kết quả từng test' },
  { path: '/settings/appearance', signedIn: false, ready: 'Dùng giao diện riêng' },
  { path: '/settings', signedIn: true, ready: 'Mặc định và hiển thị' },
  { path: '/settings/security', signedIn: true, ready: 'Xác thực hai bước' },
  { path: '/settings/data', signedIn: true, ready: 'Giới hạn' },
] as const;

for (const { path, signedIn, ready } of PAGES)
  test(`${path} does not scroll sideways at 375 px`, async ({ page, api }) => {
    api.signedIn = signedIn;
    if (path.startsWith('/contests')) await page.clock.setFixedTime(CONTEST_FIXTURE_NOW);
    await page.goto(path);
    await expect(
      page.getByText(ready, { exact: true }).filter({ visible: true }).first(),
    ).toBeVisible();
    expect(await horizontalPageScroll(page)).toBeLessThanOrEqual(0);
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
      return {
        style: style.outlineStyle,
        width: parseFloat(style.outlineWidth),
        offset: parseFloat(style.outlineOffset),
        colour: style.outlineColor,
      };
    });
    expect(ring.style).toBe('solid');
    expect(ring.width).toBeGreaterThanOrEqual(2);
    expect(ring.offset, 'inset: the ring is drawn inside the box, not clipped by it').toBeLessThan(
      0,
    );
    expect(ring.colour).not.toBe('rgba(0, 0, 0, 0)');
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => region.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  });
