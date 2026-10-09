import type { Page } from '@playwright/test';
import { editableContest } from '../src/test/admin-fixtures/contests';
import { ghost, GHOST_CSV, unrankedGhost } from '../src/test/admin-fixtures/ghosts';
import { THEMES } from '../src/theme/registry';
import { adminOk, confirmInDialog, dialogOf, signInAsStaff } from './fixtures/admin';
import { expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { applyTheme, AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { defineShiftTests, PHONE_AND_DESKTOP } from './fixtures/layout-shift';

const PATH = '/admin/contests/hcmus-w41/ghosts';
const fitsWidth = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
const withGhosts = (api: FakeApi) => {
  signInAsStaff(api, ['judge.edit_own_contest']);
  api.routes['GET /contests/hcmus-w41'] = adminOk(editableContest());
  api.routes['GET /contests/hcmus-w41/ghosts'] = adminOk({ ghosts: [ghost(), unrankedGhost()] });
  api.routes['PUT /contests/hcmus-w41/ghosts'] = ({ body }) =>
    adminOk({ stored: !(body as { dryRun?: boolean }).dryRun, ghosts: [ghost(), unrankedGhost()] });
};

test('staff preview a ghost CSV, see the unranked rows, and replace the set after confirming', async ({
  page,
  api,
}) => {
  withGhosts(api);
  await page.goto(PATH);
  await page.locator('[data-testid="ghost-csv"] input').setInputFiles({
    name: 'hsg-2024.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(GHOST_CSV),
  });
  await page.getByRole('switch', { name: 'Ẩn danh tên' }).click();
  await page.getByRole('button', { name: 'Xem trước' }).click();
  await expect(page.getByText('1 dòng không đủ dữ liệu, sẽ xếp cuối:')).toBeVisible();
  await expect(page.getByTestId('admin-bit').first()).toBeVisible();
  await page.getByRole('button', { name: 'Thay thế bộ ghost' }).click();
  await expect(dialogOf(page).getByRole('link', { name: 'Tải CSV hiện tại' })).toHaveAttribute(
    'href',
    '/api/internal/contests/hcmus-w41/ghosts/csv',
  );
  await confirmInDialog(page, 'Thay thế');
  await expect(page.getByText('Đã lưu 2 ghost. Bản phát lại sẽ được dựng lại.')).toBeVisible();
  const bodies = api
    .requestsTo('PUT /contests/hcmus-w41/ghosts')
    .map((seen) => JSON.parse(String(seen.postData)));
  expect(bodies.map((body) => [body.anonymize, body.dryRun])).toEqual([
    [true, true],
    [true, false],
  ]);
});

test('a refused CSV lists every row with Bit', async ({ page, api }) => {
  withGhosts(api);
  api.routes['PUT /contests/hcmus-w41/ghosts'] = {
    status: 400,
    body: {
      error: {
        code: 'ghost_import_invalid',
        message: 'x',
        issues: [
          { field: 'csv', code: 'label_formula', message: 'x', row: 2 },
          { field: 'csv', code: 'cell_invalid', message: 'x', row: 3 },
        ],
      },
    },
  };
  await page.goto(PATH);
  await page.locator('[data-testid="ghost-csv"] input').setInputFiles({
    name: 'bad.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('label,caption\n=cmd,,1'),
  });
  await page.getByRole('button', { name: 'Xem trước' }).click();
  const alert = page.getByTestId('ghost-import').getByRole('alert');
  await expect(alert.getByRole('listitem')).toHaveCount(2);
  await expect(alert.locator('[data-placement="refused"]')).toBeVisible();
});

test('an empty set shows Bit and a final-submission contest shows the unsupported notice', async ({
  page,
  api,
}) => {
  withGhosts(api);
  api.routes['GET /contests/hcmus-w41/ghosts'] = adminOk({ ghosts: [] });
  await page.goto(PATH);
  await expect(page.getByTestId('ghost-current').getByTestId('inline-bit')).toBeVisible();
  api.routes['GET /contests/hcmus-w41'] = adminOk(
    editableContest({ formatName: 'final_submission' }),
  );
  await page.goto(PATH);
  await expect(
    page.locator('[data-testid="ghost-unsupported"] [data-placement="forbidden"]'),
  ).toBeVisible();
});

for (const viewport of AUDIT_VIEWPORTS)
  for (const theme of THEMES)
    test(`the ghost tab is accessible in ${theme.id} at ${viewport.name}`, async ({
      page,
      api,
    }) => {
      await page.setViewportSize(viewport);
      withGhosts(api);
      await applyTheme(page, api, theme);
      await page.goto(PATH);
      await expect(
        page.getByTestId('ghost-current').getByRole('cell', { name: 'Bob' }),
      ).toBeVisible();
      expect(await axeViolationsIn(page)).toEqual([]);
      expect(await fitsWidth(page)).toBe(true);
    });

defineShiftTests([
  {
    name: 'ghost tab',
    path: PATH,
    signedIn: true,
    hold: 'GET /contests/hcmus-w41/ghosts',
    answer: withGhosts,
    parts: (page) => ({
      tabs: page.getByRole('navigation', { name: 'Các phần của kỳ thi' }),
      grid: page.locator('[data-ghost-part="grid"]'),
    }),
    viewports: PHONE_AND_DESKTOP,
    placedOnly: ['grid'],
    placed: ['grid'],
  },
]);
