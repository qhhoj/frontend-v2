import type { Locator, Page } from '@playwright/test';
import { ranking, rankingRow } from '../src/test/fixtures';
import { ticketDetail, ticketItem } from '../src/test/community-fixtures';
import { CONTEST_FIXTURE_NOW, expect, test } from './fixtures/api';
import { adminList, adminOk, signInAsStaff } from './fixtures/admin';

/**
 * Layout regressions found by the UI audit, each asserted at the width where it failed. Everything is measured
 * (box sizes, whether a scroller clips), never a class name.
 */
const at = (page: Page, width: number, height = 900) => page.setViewportSize({ width, height });
const widthOf = (locator: Locator) => locator.evaluate((el) => el.getBoundingClientRect().width);
const pageOverflow = (page: Page) =>
  page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - innerWidth));
/** Pixels of the scroller's content that do not fit (0 when nothing hides). */
const hiddenPx = (scroller: Locator) =>
  scroller.evaluate((el) => Math.max(0, el.scrollWidth - el.clientWidth));
const scrollerOf = (page: Page, name: string) => page.getByRole('region', { name });

test.describe('leaderboard', () => {
  for (const width of [768, 1024])
    test(`keeps the user column readable and the table inside its card at ${width}`, async ({
      page,
      api,
    }) => {
      api.signedIn = true;
      await at(page, width);
      await page.goto('/users');
      const name = page.getByRole('link', { name: 'user_07' }).first();
      await expect(name).toBeVisible();
      expect(await widthOf(page.getByRole('columnheader', { name: 'Người dùng' }))).toBeGreaterThan(
        150,
      );
      expect(await name.evaluate((el) => el.clientWidth >= el.scrollWidth)).toBe(true);
      const card = page
        .locator('table')
        .first()
        .locator('xpath=ancestor::*[contains(@class,"glass")][1]');
      const [table, frame] = await Promise.all([
        widthOf(page.locator('table').first()),
        widthOf(card),
      ]);
      const scroller = scrollerOf(page, 'Bảng xếp hạng, cuộn ngang');
      expect(table <= frame || (await hiddenPx(scroller)) > 0).toBe(true);
      expect(await pageOverflow(page)).toBe(0);
    });

  test('shows one viewport of skeleton rows, not a page of one hundred', async ({ page, api }) => {
    api.hold('GET /users');
    await page.goto('/users');
    await expect(page.locator('[data-skeleton-region="board"]')).toBeVisible();
    expect(
      await page.locator('[data-skeleton-region="board"] tbody tr').count(),
    ).toBeLessThanOrEqual(12);
  });
});

test.describe('submissions list', () => {
  for (const width of [1280, 1440])
    test(`fits every column without sideways scrolling at ${width}`, async ({ page, api }) => {
      api.signedIn = true;
      await at(page, width);
      await page.goto('/submissions');
      await expect(page.getByText('Tổng hai số')).toBeVisible();
      for (const heading of [
        'Kết quả',
        'Bài',
        'Người nộp',
        'Điểm',
        'Thời gian',
        'Bộ nhớ',
        'Ngôn ngữ',
        'Lúc',
      ])
        await expect(page.getByRole('columnheader', { name: heading })).toBeVisible();
      expect(await hiddenPx(scrollerOf(page, 'Bảng bài nộp, cuộn ngang'))).toBe(0);
      await expect(page.getByTestId('scroll-hint')).toHaveCount(0);
    });

  test('drops low-value columns as the card narrows and keeps verdict, problem, user, score and source', async ({
    page,
    api,
  }) => {
    api.signedIn = true;
    await at(page, 1024);
    await page.goto('/submissions');
    await expect(page.getByText('Tổng hai số')).toBeVisible();
    for (const kept of ['Kết quả', 'Bài', 'Người nộp', 'Điểm'])
      await expect(page.getByRole('columnheader', { name: kept })).toBeVisible();
    for (const dropped of ['Thời gian', 'Bộ nhớ'])
      await expect(page.getByRole('columnheader', { name: dropped })).toBeHidden();
    await expect(page.getByRole('link', { name: 'Xem mã nguồn' })).toBeVisible();
    expect(await hiddenPx(scrollerOf(page, 'Bảng bài nộp, cuộn ngang'))).toBe(0);
  });

  test('says so on a phone where the table still scrolls', async ({ page, api }) => {
    api.signedIn = true;
    await at(page, 390);
    await page.goto('/submissions');
    await expect(page.getByTestId('scroll-hint')).toBeVisible();
    expect(await hiddenPx(scrollerOf(page, 'Bảng bài nộp, cuộn ngang'))).toBeGreaterThan(0);
  });
});

test.describe('swipe cue on phone tables', () => {
  for (const [path, region] of [
    ['/problems', 'Bảng bài, cuộn ngang'],
    ['/contests', 'Bảng kỳ thi đã kết thúc, cuộn ngang'],
  ] as const)
    test(`${path} hints that its table scrolls`, async ({ page, api }) => {
      api.signedIn = true;
      await page.clock.setFixedTime(CONTEST_FIXTURE_NOW);
      await at(page, 390);
      await page.goto(path);
      const scroller = page.getByRole('region', { name: region });
      await expect(scroller).toBeVisible();
      expect(await hiddenPx(scroller)).toBeGreaterThan(0);
      await expect(page.getByTestId('scroll-hint').first()).toBeVisible();
      await expect(page.getByTestId('scroll-shade-right').first()).toBeVisible();
    });
});

test.describe('admin', () => {
  const queueRoutes = (api: Parameters<typeof signInAsStaff>[0]) => {
    signInAsStaff(api, ['judge.change_ticket']);
    api.routes['GET /tickets'] = adminList([ticketItem({ id: 't-1', title: 'Test 7 sai đáp án' })]);
    api.routes['GET /tickets/t-1'] = adminOk(
      ticketDetail({ id: 't-1', title: 'Test 7 sai đáp án' }),
    );
  };

  test('the ticket queue header keeps a readable column at 390', async ({ page, api }) => {
    queueRoutes(api);
    await at(page, 390);
    await page.goto('/admin/tickets');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await widthOf(page.getByRole('heading', { level: 1 }))).toBeGreaterThan(200);
  });

  test('the ticket list is wide enough at 1280 that dates stay on one line', async ({
    page,
    api,
  }) => {
    queueRoutes(api);
    await at(page, 1280);
    await page.goto('/admin/tickets?ticket=t-1');
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
    expect(await widthOf(table)).toBeGreaterThan(400);
    const date = table.locator('tbody tr').first().locator('td').last();
    const lines = await date.evaluate((el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      return new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size;
    });
    expect(lines).toBe(1);
    expect(await hiddenPx(scrollerOf(page, 'Danh sách phiếu'))).toBe(0);
  });

  test('the users list scrolls inside its frame, never the page, at 390', async ({ page, api }) => {
    signInAsStaff(api, ['judge.ban_user']);
    api.routes['GET /admin/users'] = adminList([], { total: 0 });
    const { staffUser } = await import('../src/test/admin-fixtures/users');
    api.routes['GET /admin/users'] = adminList(
      [staffUser(), staffUser({ id: 'u-2', username: 'spammer' })],
      {
        total: 2,
      },
    );
    await at(page, 390);
    await page.goto('/admin/users');
    await expect(page.getByText('spammer')).toBeVisible();
    expect(await pageOverflow(page)).toBe(0);
  });

  test('marks one nav item current on the organization quotas page', async ({ page, api }) => {
    signInAsStaff(api, ['judge.change_organization', 'judge.add_organization'], true);
    await at(page, 1440);
    await page.goto('/admin/organizations/quotas');
    const nav = page.locator('aside').getByRole('navigation').first();
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
    await expect(nav.locator('[aria-current="page"]')).toContainText('Hạn mức tổ chức');
  });
});

test('the contest podium keeps the first-place name readable at 768', async ({ page, api }) => {
  api.routes['GET /contests/r42/ranking'] = {
    body: {
      data: ranking({
        rows: [
          rankingRow(1, 'p1', 'a_quite_long_user_name', 3, 40, {}),
          rankingRow(2, 'p2', 'user_12', 2, 55, {}),
          rankingRow(3, 'p3', 'user_03', 1, 14, {}),
        ],
      }),
    },
  };
  await at(page, 768);
  await page.goto('/contests/r42/ranking');
  const first = page.getByRole('region', { name: 'Top 3' }).getByRole('link').first();
  await expect(first).toBeVisible();
  expect(await widthOf(first)).toBeGreaterThan(100);
  expect(await first.evaluate((el) => el.clientWidth >= el.scrollWidth)).toBe(true);
});

test.describe('ended contests', () => {
  for (const width of [1024, 768])
    test(`fit their columns at ${width} and keep them while loading`, async ({ page, api }) => {
      api.signedIn = true;
      await page.clock.setFixedTime(CONTEST_FIXTURE_NOW);
      await at(page, width);
      const release = api.hold('GET /contests');
      await page.goto('/contests');
      const skeleton = page.locator('[data-skeleton-region="ended-row"]').first();
      await expect(skeleton).toBeVisible();
      const heads = (scope: Locator) =>
        scope.evaluate((el) =>
          [...el.closest('table')!.querySelectorAll('thead th')]
            .filter((th) => th.getBoundingClientRect().width > 0)
            .map((th) => Math.round(th.getBoundingClientRect().width)),
        );
      const loading = await heads(skeleton);
      release();
      const table = page.getByTestId('ended-contests').locator('table');
      await expect(table).toBeVisible();
      expect(
        await hiddenPx(page.getByRole('region', { name: 'Bảng kỳ thi đã kết thúc, cuộn ngang' })),
      ).toBe(0);
      const loaded = await heads(table.locator('tbody tr').first());
      expect(loaded).toEqual(loading);
    });
});

test('the school picker shows a focus indicator when tabbed to', async ({ page, api }) => {
  void api;
  await page.goto('/register');
  const combo = page.getByRole('combobox').first();
  await combo.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(combo).toBeFocused();
  const outline = await page
    .getByTestId('school-picker')
    .locator('[data-pc-name="select"]')
    .evaluate((el) => {
      const style = getComputedStyle(el);
      return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
    });
  expect(outline.style).not.toBe('none');
  expect(outline.width).toBeGreaterThanOrEqual(2);
});

test('the problems toolbar never separates sort from the random pick, and fits one row at 1280', async ({
  page,
  api,
}) => {
  api.signedIn = true;
  // Wider letters stand in for a wider font than the test machine's.
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const style = document.createElement('style');
      style.textContent = '[role=search] * { letter-spacing: 0.03em; }';
      document.head.append(style);
    });
  });
  const centerY = (locator: Locator) =>
    locator.evaluate(
      (el) => el.getBoundingClientRect().top + el.getBoundingClientRect().height / 2,
    );
  for (const width of [1280, 1100, 900]) {
    await at(page, width);
    await page.goto('/problems');
    const sort = page.getByRole('combobox', { name: 'Sắp xếp' });
    await expect(sort).toBeVisible();
    const gap = Math.abs(
      (await centerY(sort)) - (await centerY(page.getByRole('button', { name: 'Bài ngẫu nhiên' }))),
    );
    expect(gap).toBeLessThanOrEqual(2);
  }
  await at(page, 1280);
  await page.goto('/problems');
  const tops = await page
    .locator('[role=search] > *')
    .evaluateAll((items) => items.map((el) => Math.round(el.getBoundingClientRect().top)));
  expect(new Set(tops).size).toBe(1);
});

test.describe('problem page dock', () => {
  const footerLinkClearsDock = async (page: Page) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const { link, dock } = await page.evaluate(() => {
      const fixed = [...document.querySelectorAll('section')].find(
        (el) => getComputedStyle(el).position === 'fixed',
      )!;
      const target = [...document.querySelectorAll('footer a, footer button')].pop()!;
      return {
        link: target.getBoundingClientRect().bottom,
        dock: fixed.getBoundingClientRect().top,
      };
    });
    return link <= dock;
  };
  for (const width of [390, 1024])
    test(`the anonymous sign-in bar leaves the footer link reachable at ${width}`, async ({
      page,
      api,
    }) => {
      void api;
      await at(page, width);
      await page.goto('/problems/duongdi');
      await expect(page.getByRole('link', { name: 'Đăng nhập để nộp bài' })).toBeVisible();
      expect(await footerLinkClearsDock(page)).toBe(true);
    });

  test('the signed-in dock takes at most a quarter of a 900 px viewport', async ({ page, api }) => {
    api.signedIn = true;
    await at(page, 1440, 900);
    await page.goto('/problems/duongdi');
    const dock = page.getByRole('region', { name: 'Nộp bài' });
    await expect(dock).toBeVisible();
    expect(await dock.evaluate((el) => el.getBoundingClientRect().height)).toBeLessThanOrEqual(225);
    await expect(page.getByRole('button', { name: 'Nộp bài' })).toBeVisible();
  });
});

test.describe('filter controls share one style', () => {
  const styleOf = (locator: Locator) =>
    locator.evaluate((el) => {
      const style = getComputedStyle(el);
      return [
        style.height,
        style.borderTopWidth,
        style.borderTopColor,
        style.borderTopLeftRadius,
        style.backgroundColor,
        style.fontSize,
      ].join('|');
    });
  for (const width of [1280, 390])
    test(`the contests search box and the rated select look alike at ${width}`, async ({
      page,
      api,
    }) => {
      api.signedIn = true;
      await page.clock.setFixedTime(CONTEST_FIXTURE_NOW);
      await at(page, width);
      await page.goto('/contests');
      const search = page.getByRole('searchbox').locator('xpath=..');
      const select = page.getByRole('combobox').first().locator('xpath=..');
      await expect(search).toBeVisible();
      expect(await styleOf(select)).toBe(await styleOf(search));
    });
  test('the problems search box matches its toolbar selects', async ({ page, api }) => {
    api.signedIn = true;
    await at(page, 1280);
    await page.goto('/problems');
    const search = page.getByRole('searchbox').first().locator('xpath=..');
    const select = page.getByRole('combobox', { name: 'Sắp xếp' }).locator('xpath=..');
    expect(await styleOf(select)).toBe(await styleOf(search));
  });
});
