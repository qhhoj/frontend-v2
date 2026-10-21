import type { Page } from '@playwright/test';
import { expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { axeViolationsIn } from './fixtures/audit';
import { adminOk, dialogOf, signInAsStaff } from './fixtures/admin';
import {
  editableProblem,
  problemData,
  problemEditingMeta,
} from '../src/test/admin-fixtures/problems';
import { importJob, polygonLinkState } from '../src/test/admin-fixtures/polygon';

/** The data tab's Polygon card (link panel option C), one state per test step; `SHOTS_DIR` saves each state. */
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 375, height: 812 },
] as const;
const DATA_TAB = '/admin/problems/hcmus41c/data?view=advanced';
const OPTIONS = {
  appendMainSolution: false,
  ignoreZeroPointBatches: false,
  ignoreZeroPointCases: false,
  mainStatementLanguage: 'vietnamese',
  maxCases: 100,
  statementLanguages: ['english=en'],
  tutorialLanguage: 'vietnamese',
};
type LinkOverrides = Parameters<typeof polygonLinkState>[0];
const linkState = (link: LinkOverrides = {}, runningJobId: string | null = null) => ({
  ...polygonLinkState({ owner: 'bitcoder', options: OPTIONS, ...link }),
  runningJobId,
});
const failedSync: LinkOverrides = {
  lastSyncResult: 'failed',
  lastSyncError: 'statement russian has no site language',
  lastSyncErrorCode: 'statement_language_unmapped',
  lastSyncErrorParams: { language: 'russian' },
};

function panelRoutes(api: FakeApi, state: ReturnType<typeof linkState>) {
  signInAsStaff(api, ['judge.edit_own_problem', 'judge.sync_polygon_problem']);
  api.routes['GET /problems/hcmus41c'] = adminOk(editableProblem());
  api.routes['GET /problems/meta'] = adminOk(problemEditingMeta());
  api.routes['GET /problems/hcmus41c/data'] = adminOk(problemData());
  api.routes['GET /problems/hcmus41c/polygon'] = adminOk(state);
}

async function shoot(page: Page, viewport: string, state: string) {
  const shots = process.env.SHOTS_DIR;
  // The viewport, the panel at its top: a full-page shot drags the fixed save bar and drawer over the tab.
  await page.getByTestId('polygon-link-panel').evaluate((panel) => panel.scrollIntoView());
  if (shots) await page.screenshot({ path: `${shots}/${state}-${viewport}.png` });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

const banner = (page: Page) => page.getByTestId('polygon-link-panel').locator('[data-banner]');

for (const viewport of VIEWPORTS) {
  test(`Polygon link panel at ${viewport.name}: a newer package, synced from the banner`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    panelRoutes(api, linkState());
    api.routes['POST /problems/hcmus41c/polygon/sync'] = {
      status: 202,
      body: { data: { jobId: 'job-sync' } },
    };
    api.routes['GET /problems/imports/job-sync'] = adminOk(
      importJob({
        id: 'job-sync',
        code: 'hcmus41c',
        purpose: 'sync',
        state: 'waiting',
        queuePosition: 1,
      }),
    );
    await page.goto(DATA_TAB);
    await expect(banner(page)).toHaveAttribute('data-banner', 'newer');
    await expect(banner(page)).toContainText('Có bản mới: r14 (đang dùng r12)');
    await expect(page.getByTestId('polygon-link-options')).toContainText(
      'vietnamese (chính) · english → en · lời giải từ vietnamese',
    );
    expect(await axeViolationsIn(page)).toEqual([]);
    await shoot(page, viewport.name, 'panel-newer');

    await banner(page).getByRole('button', { name: 'Đồng bộ ngay' }).click();
    await dialogOf(page).getByRole('button', { name: 'Đồng bộ và ghi đè' }).click();
    await expect(banner(page)).toHaveAttribute('data-banner', 'running');
    await expect(banner(page)).toContainText('Thứ 1 trong hàng đợi');
    await expect(banner(page).getByRole('button')).toHaveCount(0);
  });

  test(`Polygon link panel at ${viewport.name}: a sync running before the reload`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    panelRoutes(api, linkState({}, 'job-run'));
    api.routes['GET /problems/imports/job-run'] = adminOk(
      importJob({
        id: 'job-run',
        code: 'hcmus41c',
        purpose: 'sync',
        state: 'active',
        step: 'generating',
        progress: { step: 'generating', done: 18, total: 42 },
      }),
    );
    await page.goto(DATA_TAB);
    await expect(banner(page)).toHaveAttribute('data-banner', 'running');
    await expect(banner(page)).toContainText('Đang sinh test 18/42');
    await expect(banner(page).getByRole('button')).toHaveCount(0);
    await shoot(page, viewport.name, 'panel-running');
  });

  test(`Polygon link panel at ${viewport.name}: a failure the options caused, fixed in the drawer`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    const state = linkState(failedSync);
    panelRoutes(api, state);
    api.routes['PATCH /problems/hcmus41c/polygon'] = ({ body }) =>
      adminOk({
        ...state.link,
        options: { ...OPTIONS, ...(body as Record<string, unknown>) },
      });
    await page.goto(DATA_TAB);
    await expect(banner(page)).toHaveAttribute('data-banner', 'failed');
    await expect(banner(page)).toContainText('Đề russian chưa được gán ngôn ngữ');
    await expect(banner(page)).not.toContainText('site language');
    await shoot(page, viewport.name, 'panel-failed');

    await banner(page).getByRole('button', { name: 'Sửa tùy chọn' }).click();
    const drawer = dialogOf(page);
    await expect(drawer).toContainText('Tùy chọn khi đồng bộ');
    await expect(drawer.getByLabel('russian')).toHaveValue('skip');
    await expect(drawer).toContainText('Chọn en, vi hoặc Bỏ qua cho đề russian.');
    expect(await axeViolationsIn(page)).toEqual([]);
    await shoot(page, viewport.name, 'panel-edit');

    await drawer.getByRole('button', { name: 'Lưu tùy chọn' }).click();
    await expect(banner(page)).toHaveAttribute('data-banner', 'saved');
    const [patch] = api.requestsTo('PATCH /problems/hcmus41c/polygon');
    expect(JSON.parse(patch?.postData?.toString() ?? '{}')).toMatchObject({
      mainStatementLanguage: 'vietnamese',
      statementLanguages: ['english=en', 'russian=skip'],
    });
    await expect(banner(page).getByRole('button', { name: 'Đồng bộ lại' })).toBeVisible();
    await expect(page.getByTestId('polygon-link-options')).toContainText('russian: bỏ qua');
    await shoot(page, viewport.name, 'panel-saved');
  });
}
