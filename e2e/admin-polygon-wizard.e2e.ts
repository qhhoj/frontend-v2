import type { Page } from '@playwright/test';
import { expect, test } from './fixtures/api';
import type { FakeApi, Reply } from './fixtures/api';
import { axeViolationsIn } from './fixtures/audit';
import { sessionResponse, sessionUser } from '../src/test/fixtures';
import { adminOk, confirmInDialog, dialogOf, signInAsStaff } from './fixtures/admin';

/** Polygon wizard steps 1 and 2 (link option A, configure option A), one link per state; `SHOTS_DIR` saves each state. */
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 375, height: 812 },
] as const;
const PERMISSIONS = ['judge.add_problem', 'judge.edit_own_problem', 'judge.sync_polygon_problem'];
const META = {
  types: [{ id: '0192a000-0000-7000-8000-0000000000aa', name: 'dp', fullName: 'Quy hoạch động' }],
  groups: [{ id: '0192a000-0000-7000-8000-0000000000bb', name: 'graph', fullName: 'Đồ thị' }],
  licenses: [],
  languages: [],
};
const linkOf = (name: string) => `https://polygon.codeforces.com/pAbC123/bitcoder/${name}`;
const statement = (language: string, hasTutorial = false) => ({
  language,
  title: null,
  hasTutorial,
});
const problem = (name: string, overrides: Record<string, unknown> = {}) => ({
  id: 422052,
  name,
  title: 'K số lớn nhất',
  owner: 'bitcoder',
  revision: 9,
  modified: false,
  statements: [statement('english', true), statement('russian'), statement('vietnamese', true)],
  latestPackage: {
    id: 1100001,
    revision: 9,
    state: 'READY',
    type: 'full',
    createdAt: '2026-10-01T03:00:00Z',
  },
  ...overrides,
});
const refusal = (status: number, code: string, extra: Record<string, unknown> = {}) => ({
  status,
  body: { error: { code, message: code, ...extra } },
});
const job = (id: string, code: string, state: string, minutesAgo: number) => ({
  id,
  code,
  mode: 'create',
  purpose: 'link',
  state,
  step: state === 'active' ? 'generating' : state === 'completed' ? 'done' : 'failed',
  progress: null,
  queuePosition: null,
  result: null,
  error: null,
  errorCode: null,
  errorParams: null,
  failedStep: null,
  retryable: false,
  createdAt: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
  finishedAt: null,
});

/** One answer per Polygon short name, so each pasted link shows one state. */
const RESOLVE: Record<string, () => Reply> = {
  kminmax: () => adminOk(problem('kminmax')),
  stale: () =>
    adminOk(
      problem('stale', {
        revision: 10,
        modified: true,
        latestPackage: { ...problem('x').latestPackage, type: 'standard' },
      }),
    ),
  gone: () => refusal(409, 'polygon_linked_deleted', { linkedProblemCode: 'abc' }),
  failed: () =>
    refusal(409, 'polygon_package_not_ready', {
      newestPackage: {
        id: 1100002,
        revision: 11,
        state: 'FAILED',
        comment: 'solution wa.cpp passed all tests but is tagged WA',
      },
    }),
  busy: () => ({ ...refusal(409, 'polygon_link_checking'), headers: { 'Retry-After': '60' } }),
};

function mockWizard(api: FakeApi) {
  signInAsStaff(api, PERMISSIONS);
  api.routes['GET /auth/me'] = adminOk(
    sessionResponse({
      user: sessionUser({
        username: 'bitcoder',
        isStaff: true,
        permissions: PERMISSIONS,
        adminCapabilities: {
          organizations: false,
          problemCreation: { site: true, organizations: false },
          contestCreation: { site: false, organizations: false },
        },
      }),
    }),
  );
  api.routes['GET /polygon/status'] = adminOk({ connected: true, accountName: 'bitcoder' });
  api.routes['GET /problems/meta'] = adminOk(META);
  api.routes['GET /problems/imports'] = adminOk([
    job('job-3', 'kminmax', 'active', 2),
    job('job-2', 'lcshint', 'failed', 40),
    job('job-1', 'sort', 'completed', 95),
  ]);
  api.routes['POST /polygon/resolve'] = ({ body }) => {
    const name = (body as { link: string }).link.split('/').pop() ?? '';
    return (RESOLVE[name] ?? RESOLVE.kminmax)();
  };
  api.routes['GET /problems/kminmax'] = refusal(404, 'not_found');
  api.routes['GET /problems/abc'] = adminOk({
    code: 'abc',
    name: 'Dãy con có tổng lớn nhất',
    canEdit: true,
  });
}

async function shoot(page: Page, viewport: string, state: string) {
  const shots = process.env.SHOTS_DIR;
  if (shots) await page.screenshot({ path: `${shots}/${state}-${viewport}.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

async function paste(page: Page, link: string) {
  await page.locator('#polygon-link').fill(link);
}

for (const viewport of VIEWPORTS) {
  test(`Polygon link step states at ${viewport.name}`, async ({ page, api }) => {
    await page.setViewportSize(viewport);
    mockWizard(api);
    await page.goto('/admin/problems/polygon');
    await expect(page.getByTestId('polygon-my-imports')).toContainText('lcshint');
    await expect(page.getByText('Cấp quyền đọc', { exact: true })).toBeVisible();
    await shoot(page, viewport.name, 'link-empty');

    await paste(page, linkOf('stale'));
    await expect(page.locator('[data-caution="stale"]')).toContainText('Polygon đã có r10');
    await expect(page.locator('[data-caution="standard"]')).toBeVisible();
    await expect(page.getByTestId('polygon-how-to')).not.toHaveAttribute('open');
    expect(await axeViolationsIn(page)).toEqual([]);
    await shoot(page, viewport.name, 'link-cautions');

    await paste(page, 'https://polygon.codeforces.com/generalInfo?ccid=a1b2c3&session=d4e5f6');
    await expect(page.locator('[data-refusal="editing"]')).toBeVisible();
    await shoot(page, viewport.name, 'link-editing');

    await paste(page, linkOf('gone'));
    await expect(page.locator('[data-refusal="linkedDeleted"]')).toContainText('Khôi phục abc');
    await shoot(page, viewport.name, 'link-deleted');

    await paste(page, linkOf('failed'));
    await expect(page.locator('[data-refusal="notReady"]')).toContainText('tagged WA');
    await shoot(page, viewport.name, 'link-failed');

    await paste(page, linkOf('busy'));
    await expect(page.locator('[data-refusal="checking"]')).toContainText('tự kiểm tra lại');
    await shoot(page, viewport.name, 'link-checking');

    const release = api.hold('POST /polygon/resolve');
    await paste(page, linkOf('kminmax'));
    await expect(page.getByTestId('polygon-link-slow')).toBeVisible({ timeout: 10_000 });
    await shoot(page, viewport.name, 'link-slow');
    release();
    await expect(page.getByTestId('polygon-link-verified')).toBeVisible();
    await shoot(page, viewport.name, 'link-verified');
  });

  test(`Polygon configure step at ${viewport.name}: languages, then an update confirmed`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    mockWizard(api);
    api.routes['POST /polygon/import'] = { status: 202, body: { data: { jobId: 'job-9' } } };
    api.routes['GET /problems/imports/job-9'] = adminOk(job('job-9', 'abc', 'active', 0));
    await page.goto('/admin/problems/polygon');
    await paste(page, linkOf('kminmax'));
    await page.getByRole('button', { name: 'Tiếp tục' }).click();
    await expect(page.getByTestId('polygon-languages')).toBeVisible();
    await expect(page.getByLabel('Đề chính')).toHaveValue('vietnamese');
    expect(await axeViolationsIn(page)).toEqual([]);
    await shoot(page, viewport.name, 'configure-create');

    await page.getByLabel('russian').selectOption('en');
    await page.getByRole('button', { name: 'Bắt đầu nhập' }).click();
    await expect(page.getByText('Đề khác đã là Tiếng Anh (en)')).toBeVisible();
    expect(api.requestsTo('POST /polygon/import')).toHaveLength(0);
    await shoot(page, viewport.name, 'configure-repeated');
    await page.getByLabel('russian').selectOption('skip');

    await page.getByLabel('Cập nhật').check();
    await page.getByLabel('Bài sẽ cập nhật').fill('abc');
    await expect(page.getByTestId('polygon-update-target')).toContainText(
      'Dãy con có tổng lớn nhất',
    );
    await shoot(page, viewport.name, 'configure-update');
    await page.getByRole('button', { name: 'Cập nhật abc…' }).click();
    await expect(dialogOf(page)).toContainText('Ghi đè abc bằng gói Polygon?');
    expect(api.requestsTo('POST /polygon/import')).toHaveLength(0);
    await shoot(page, viewport.name, 'configure-confirm');
    await confirmInDialog(page, 'Ghi đè abc và nhập');
    await expect.poll(() => api.requestsTo('POST /polygon/import').length).toBe(1);
  });
}

/** Progress option B: one job per state, opened by its `?job=` link (a reload: no form to edit or body to retry). */
const progressJob = (id: string, overrides: Record<string, unknown>) => ({
  ...job(id, 'kminmax', 'active', 7),
  finishedAt: new Date().toISOString(),
  ...overrides,
});
const SUMMARY = {
  checker: 'bridged',
  polygonChecker: 'std::wcmp.cpp',
  interactive: false,
  checkerIgnored: false,
  tests: 42,
  cases: 42,
  batches: 4,
  timeLimit: { polygon: 1, applied: 1 },
  memoryLimit: { polygon: 1048576, applied: 524288 },
};
const PROGRESS_JOBS: Record<string, Record<string, unknown>> = {
  queued: { state: 'waiting', step: 'queued', queuePosition: 2, finishedAt: null },
  run: {
    step: 'generating',
    progress: { step: 'generating', done: 18, total: 42 },
    finishedAt: null,
  },
  done: {
    state: 'completed',
    step: 'done',
    result: { problemId: 'p-1', code: 'kminmax', summary: SUMMARY, attention: null },
  },
  attention: {
    state: 'completed',
    step: 'done',
    result: {
      problemId: 'p-1',
      code: 'kminmax',
      summary: SUMMARY,
      attention: { code: 'imported_needs_attention', params: {}, message: 'init.yml failed' },
    },
  },
};
const failedJob = (id: string, errorCode: string, extra: Record<string, unknown> = {}) =>
  progressJob(id, { state: 'failed', step: 'failed', errorCode, ...extra });
const outcome = (page: Page) => page.getByTestId('import-outcome');

for (const viewport of VIEWPORTS) {
  test(`Polygon progress states at ${viewport.name}`, async ({ page, api }) => {
    await page.setViewportSize(viewport);
    mockWizard(api);
    for (const [state, overrides] of Object.entries(PROGRESS_JOBS))
      api.routes[`GET /problems/imports/job-${state}`] = adminOk(
        progressJob(`job-${state}`, overrides),
      );
    api.routes['POST /problems/kminmax/polygon/sync'] = {
      status: 202,
      body: { data: { jobId: 'job-run' } },
    };

    await page.goto('/admin/problems/polygon?job=job-queued');
    await expect(outcome(page)).toContainText('Thứ 2 trong hàng đợi');
    await expect(outcome(page)).toContainText('Trước bạn: 1 lượt.');
    await shoot(page, viewport.name, 'progress-queued');

    await page.goto('/admin/problems/polygon?job=job-run');
    await expect(outcome(page)).toContainText('Đang sinh test 18/42');
    await expect(
      page.getByTestId('import-step-bar').locator('[data-status="current"]'),
    ).toHaveCount(1);
    await shoot(page, viewport.name, 'progress-run');

    await page.goto('/admin/problems/polygon?job=job-done');
    await expect(page.getByTestId('import-summary')).toContainText('std::wcmp.cpp');
    await expect(page.getByTestId('import-summary')).toContainText('Polygon: 1024MB');
    await expect(outcome(page).getByRole('link', { name: 'Mở kminmax' })).toBeVisible();
    expect(await axeViolationsIn(page)).toEqual([]);
    await shoot(page, viewport.name, 'progress-done');

    await page.goto('/admin/problems/polygon?job=job-attention');
    await expect(outcome(page)).toContainText('Đã nhập kminmax, cần xem lại');
    await expect(outcome(page).getByRole('link', { name: 'Mở kminmax' })).toBeVisible();
    await shoot(page, viewport.name, 'progress-attention');
    await outcome(page).getByRole('button', { name: 'Đồng bộ lại kminmax' }).click();
    await expect(page).toHaveURL(/job=job-run/);
    await expect(outcome(page)).toContainText('Đang nhập kminmax');
  });

  test(`Polygon progress at ${viewport.name}: a failure, back to the kept options, then a retry`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    mockWizard(api);
    const started = ['job-unmapped', 'job-outage', 'job-retried'];
    api.routes['POST /polygon/import'] = () => ({
      status: 202,
      body: { data: { jobId: started.shift() } },
    });
    api.routes['GET /problems/imports/job-unmapped'] = adminOk(
      failedJob('job-unmapped', 'statement_language_unmapped', {
        errorParams: { language: 'russian' },
        failedStep: 'statements',
      }),
    );
    api.routes['GET /problems/imports/job-outage'] = adminOk(
      failedJob('job-outage', 'polygon_unavailable', {
        retryable: true,
        failedStep: 'downloading',
      }),
    );
    api.routes['GET /problems/imports/job-retried'] = adminOk(progressJob('job-retried', {}));

    await page.goto('/admin/problems/polygon');
    await paste(page, linkOf('kminmax'));
    await page.getByRole('button', { name: 'Tiếp tục' }).click();
    await page.getByLabel('Mã bài').fill('kminmax_v2');
    const languages = page.getByTestId('polygon-languages');
    await languages.getByLabel('russian').selectOption('vi');
    await languages.getByLabel('english').selectOption('skip');
    await page.getByRole('button', { name: 'Bắt đầu nhập' }).click();

    await expect(outcome(page)).toContainText('Đề russian chưa được gán ngôn ngữ');
    await expect(outcome(page)).toContainText('Dừng ở bước: chuyển đề bài.');
    await expect(outcome(page).getByRole('button', { name: 'Thử lại' })).toHaveCount(0);
    expect(await axeViolationsIn(page)).toEqual([]);
    await shoot(page, viewport.name, 'progress-failed');

    await outcome(page).getByRole('button', { name: 'Sửa thiết lập' }).click();
    await expect(page.getByLabel('Mã bài')).toHaveValue('kminmax_v2');
    await expect(languages.getByLabel('russian')).toHaveValue('vi');
    await expect(languages.getByLabel('english')).toHaveValue('skip');
    await page.getByRole('button', { name: 'Bắt đầu nhập' }).click();

    await expect(outcome(page)).toContainText('Không kết nối được Polygon');
    await expect(outcome(page).getByRole('button', { name: 'Sửa thiết lập' })).toHaveCount(0);
    await shoot(page, viewport.name, 'progress-failed-transient');
    await outcome(page).getByRole('button', { name: 'Thử lại' }).click();
    await expect(page).toHaveURL(/job=job-retried/);
    const bodies = api
      .requestsTo('POST /polygon/import')
      .map((seen) => JSON.parse(seen.postData?.toString() ?? '{}') as { code: string });
    expect(bodies.map(({ code }) => code)).toEqual(['kminmax_v2', 'kminmax_v2', 'kminmax_v2']);
  });

  test(`Polygon progress at ${viewport.name}: polling gives up, then checks again`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    mockWizard(api);
    let isUp = true;
    api.routes['GET /problems/imports/job-lost'] = () =>
      isUp
        ? adminOk(progressJob('job-lost', PROGRESS_JOBS.run))
        : { status: 503, body: { error: { code: 'unavailable', message: 'down' } } };
    await page.clock.install();
    await page.goto('/admin/problems/polygon?job=job-lost');
    await expect(outcome(page)).toContainText('Đang sinh test 18/42');
    isUp = false;
    await expect(async () => {
      await page.clock.fastForward(40_000);
      await expect(page.locator('[data-outcome="lost"]')).toBeVisible({ timeout: 500 });
    }).toPass({ timeout: 30_000 });
    await expect(outcome(page)).toContainText('Lần cuối thấy: Đang sinh test 18/42');
    await shoot(page, viewport.name, 'progress-gaveup');

    isUp = true;
    await outcome(page).getByRole('button', { name: 'Kiểm tra lại' }).click();
    await expect(page.locator('[data-outcome="running"]')).toBeVisible();
  });
}
