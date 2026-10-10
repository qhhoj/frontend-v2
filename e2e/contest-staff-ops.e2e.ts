import type { Page } from '@playwright/test';
import {
  contestActions,
  contestDataStatus,
  editableContest,
} from '../src/test/admin-fixtures/contests';
import { THEMES } from '../src/theme/registry';
import { adminOk, confirmInDialog, signInAsStaff } from './fixtures/admin';
import { expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { applyTheme, AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';

const ACTIONS_PATH = '/admin/contests/hcmus-w41/actions';
const PUBLISH_ROUTE = 'POST /contests/hcmus-w41/publish-problems';
const fitsWidth = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

const endedEditor = (api: FakeApi) => {
  signInAsStaff(api, ['judge.edit_own_contest']);
  api.routes['GET /contests/hcmus-w41'] = adminOk(editableContest({ phase: 'ended' }));
  api.routes['GET /contests/hcmus-w41/data'] = adminOk(contestDataStatus());
  api.routes['GET /contests/hcmus-w41/actions'] = adminOk(contestActions());
  api.routes[PUBLISH_ROUTE] = ({ body }) =>
    adminOk({
      dryRun: (body as { dryRun: boolean }).dryRun,
      items: [
        {
          problemId: 'prob-a',
          code: 'hcmus41a',
          outcome: 'published',
          reason: null,
          editorial: null,
        },
        { problemId: 'prob-b', code: null, outcome: 'skipped', reason: 'deleted', editorial: null },
      ],
    });
};

test('a dry run lists every problem, then the confirmed run publishes', async ({ page, api }) => {
  endedEditor(api);
  await page.goto(ACTIONS_PATH);
  const card = page.getByTestId('publish-card');
  await card.getByRole('button', { name: 'Chạy thử' }).click();
  await expect(card.getByTestId('publish-row')).toHaveCount(2);
  await expect(card).toContainText('Bài đã bị xóa.');
  await card.getByRole('button', { name: 'Công khai', exact: true }).click();
  await confirmInDialog(page, 'Công khai');
  const done = card.getByRole('status').filter({ hasText: 'Đã công khai 1 bài' });
  await expect(done).toBeVisible();
  await expect(done.getByTestId('inline-bit')).toBeVisible();
  expect(api.requestsTo(PUBLISH_ROUTE)).toHaveLength(2);
});

for (const viewport of AUDIT_VIEWPORTS)
  for (const theme of THEMES)
    test(`the actions tab with the publish card is accessible in ${theme.id} at ${viewport.name}`, async ({
      page,
      api,
    }) => {
      await page.setViewportSize(viewport);
      endedEditor(api);
      await applyTheme(page, api, theme);
      await page.goto(ACTIONS_PATH);
      await page.getByTestId('publish-card').getByRole('button', { name: 'Chạy thử' }).click();
      await expect(page.getByTestId('publish-row')).toHaveCount(2);
      expect(await axeViolationsIn(page)).toEqual([]);
      expect(await fitsWidth(page)).toBe(true);
    });

const NO_KEY = { isActive: false, mode: null, expiresAt: null, createdBy: null, releasedAt: null };
const MINTED_KEY = 'qhf_8Kq2Zr5Lw9Tn3Vb6Xc1Md4Fg7Hj0Pa2s';

function dataTab(api: FakeApi, feedStatus: object = NO_KEY) {
  endedEditor(api);
  api.routes['GET /contests/hcmus-w41/export'] = adminOk({
    state: 'ready',
    preparedAt: '2026-10-08T12:00:00.000Z',
    readyAt: '2026-10-08T12:03:00.000Z',
    size: 8_421_376,
    nextPrepareAt: '2026-10-09T12:00:00.000Z',
  });
  api.routes['GET /contests/hcmus-w41/feed-key'] = adminOk(feedStatus);
  api.routes['POST /contests/hcmus-w41/feed-key'] = adminOk({
    username: 'feed',
    key: MINTED_KEY,
    mode: 'frozen-until-release',
    expiresAt: '2026-10-22T08:00:00.000Z',
  });
}

test('the Data tab mints a key and shows it once with copy buttons', async ({ page, api }) => {
  dataTab(api);
  await page.goto('/admin/contests/hcmus-w41/data');
  await page.getByTestId('feed-key-card').getByRole('button', { name: 'Tạo khóa' }).click();
  await confirmInDialog(page, 'Tạo khóa');
  const reveal = page.getByRole('dialog');
  await expect(reveal.getByTestId('reveal-key')).toHaveText(MINTED_KEY);
  await expect(reveal.getByRole('button', { name: 'Sao chép khóa' })).toBeVisible();
  await expect(
    reveal.locator('[data-testid="admin-bit"][data-placement="security"]'),
  ).toBeVisible();
  await confirmInDialog(page, 'Tôi đã lưu khóa');
  await expect(page.getByText(MINTED_KEY)).toHaveCount(0);
  await expect(
    page.getByTestId('export-card').getByRole('link', { name: 'Tải về' }),
  ).toHaveAttribute('href', '/api/internal/contests/hcmus-w41/export/download');
});

for (const viewport of AUDIT_VIEWPORTS)
  for (const theme of THEMES)
    test(`the Data tab and the reveal dialog are accessible in ${theme.id} at ${viewport.name}`, async ({
      page,
      api,
    }) => {
      await page.setViewportSize(viewport);
      dataTab(api);
      await applyTheme(page, api, theme);
      await page.goto('/admin/contests/hcmus-w41/data');
      await expect(page.getByTestId('feed-status')).toBeVisible();
      expect(await axeViolationsIn(page), 'tab').toEqual([]);
      await page.getByTestId('feed-key-card').getByRole('button', { name: 'Tạo khóa' }).click();
      await confirmInDialog(page, 'Tạo khóa');
      await expect(page.getByTestId('reveal-key')).toBeVisible();
      expect(await axeViolationsIn(page), 'reveal').toEqual([]);
      expect(await fitsWidth(page)).toBe(true);
    });
