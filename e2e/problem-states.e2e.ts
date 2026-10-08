import type { Page } from '@playwright/test';
import {
  CPP17_ID,
  SCRATCH_ID,
  languageItem,
  problemDetail,
  submissionDetail,
  submissionItem,
} from '../src/test/fixtures';
import { THEMES } from '../src/theme/registry';
import { expect, list, pdfReady, streamFrame, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { AUDIT_VIEWPORTS, applyTheme, axeViolationsIn } from './fixtures/audit';

/** The settle window of the live list (3 s) plus a margin. */
const SETTLE_TIMEOUT_MS = 6000;
const PDF_ADDRESS = '/api/internal/problems/duongdi/pdf';
const IS_PHONE = (width: number) => width < 768;

interface StateCase {
  name: string;
  /** Which viewports the state exists at: the dock is desktop only, the sheet phone only. */
  on: 'both' | 'desktop' | 'phone';
  /** Brings the page into the state; resolves when it is on screen. */
  enter: (page: Page, api: FakeApi) => Promise<void>;
}

const withPdf = (api: FakeApi) => {
  api.routes['GET /problems/duongdi'] = {
    body: { data: problemDetail({ pdfStatementUrl: PDF_ADDRESS }) },
  };
};
const pdfButton = (page: Page) => page.locator('#main [data-testid="header-actions"] button');
const openProblem = async (page: Page, api: FakeApi) => {
  api.signedIn = true;
  await page.goto('/problems/duongdi');
  await expect(page.locator('#main h1')).toBeVisible();
};
/** The phone's collapsed bar opens a sheet; the desktop dock is always open. */
const openSubmitControls = async (page: Page) => {
  const expand = page.getByRole('button', { name: 'Mở rộng' });
  if (IS_PHONE(page.viewportSize()!.width)) await expand.click();
  await expect(page.getByRole('combobox', { name: 'Ngôn ngữ' })).toBeVisible();
};
const pickScratch = async (page: Page) => {
  await openSubmitControls(page);
  await page.getByRole('combobox', { name: 'Ngôn ngữ' }).click();
  await page.getByRole('option', { name: /Scratch 3/ }).click();
};
const scratchOnlyProblem = (api: FakeApi, fileSizeLimit: number) => {
  api.routes['GET /problems/duongdi'] = {
    body: {
      data: problemDetail({
        allowedLanguages: [
          languageItem(CPP17_ID, 'CPP17', 'C++17'),
          languageItem(SCRATCH_ID, 'SCRATCH', 'Scratch 3', {
            fileOnly: true,
            fileSizeLimit,
            extension: 'sb3',
            ace: 'text',
          }),
        ],
      }),
    },
  };
};
const queuedFrame = streamFrame('queued', {
  submissionId: 'new',
  userId: 'u',
  problemId: 'p',
  type: 'queued',
  status: 'QU',
});

const STATES: StateCase[] = [
  {
    name: 'dock expanded',
    on: 'desktop',
    enter: async (page, api) => {
      await openProblem(page, api);
      await expect(page.locator('.cm-content').first()).toBeVisible();
    },
  },
  {
    name: 'dock collapsed',
    on: 'desktop',
    enter: async (page, api) => {
      await openProblem(page, api);
      await page.getByRole('button', { name: 'Thu gọn' }).click();
      await expect(page.getByRole('button', { name: 'Mở rộng' })).toBeVisible();
    },
  },
  {
    name: 'sheet collapsed',
    on: 'phone',
    enter: openProblem,
  },
  {
    name: 'sheet expanded',
    on: 'phone',
    enter: async (page, api) => {
      await openProblem(page, api);
      await openSubmitControls(page);
      await expect(page.locator('.cm-content').first()).toBeVisible();
    },
  },
  {
    name: 'PDF button idle',
    on: 'both',
    enter: async (page, api) => {
      withPdf(api);
      await openProblem(page, api);
      await expect(pdfButton(page)).toBeVisible();
    },
  },
  {
    name: 'PDF preparing',
    on: 'both',
    enter: async (page, api) => {
      withPdf(api);
      api.routes['GET /problems/duongdi/pdf'] = {
        status: 202,
        headers: { 'Retry-After': '30' },
        body: { data: { status: 'rendering' } },
      };
      await openProblem(page, api);
      await pdfButton(page).click();
      await expect(page.locator('#main button[aria-busy="true"]')).toBeVisible();
    },
  },
  {
    name: 'PDF ready',
    on: 'both',
    enter: async (page, api) => {
      withPdf(api);
      api.routes['GET /problems/duongdi/pdf'] = pdfReady;
      await openProblem(page, api);
      await pdfButton(page).click();
      await expect(page.getByRole('link', { name: 'Mở PDF' })).toBeVisible();
    },
  },
  {
    name: 'PDF failed',
    on: 'both',
    enter: async (page, api) => {
      withPdf(api);
      api.routes['GET /problems/duongdi/pdf'] = {
        status: 500,
        body: { error: { code: 'internal', message: 'x' } },
      };
      await openProblem(page, api);
      await pdfButton(page).click();
      await expect(page.locator('#main')).toContainText('Không thể chuẩn bị PDF');
    },
  },
  {
    name: 'file-only without a file',
    on: 'both',
    enter: async (page, api) => {
      scratchOnlyProblem(api, 5);
      await openProblem(page, api);
      await pickScratch(page);
      await expect(page.locator('input[type="file"]')).toBeAttached();
    },
  },
  {
    name: 'file-only with a file',
    on: 'both',
    enter: async (page, api) => {
      scratchOnlyProblem(api, 5);
      await openProblem(page, api);
      await pickScratch(page);
      await page.locator('input[type="file"]').setInputFiles({
        name: 'catmaze-final.sb3',
        mimeType: 'application/zip',
        buffer: Buffer.from('x'),
      });
      await expect(page.getByText('catmaze-final.sb3')).toBeVisible();
    },
  },
  {
    name: 'file-only with uploads off',
    on: 'both',
    enter: async (page, api) => {
      scratchOnlyProblem(api, 0);
      await openProblem(page, api);
      await pickScratch(page);
      await expect(page.getByText('Ngôn ngữ này không nhận tệp tải lên.')).toBeVisible();
    },
  },
  {
    name: 'submission grading',
    on: 'both',
    enter: async (page, api) => {
      api.signedIn = true;
      api.routes['GET /submissions/sub-1'] = {
        body: {
          data: submissionDetail({
            status: 'G',
            result: null,
            points: null,
            casePoints: 7,
            caseTotal: 20,
            currentTestcase: 3,
          }),
        },
      };
      api.routes['GET /events/submissions/:id'] = {
        contentType: 'text/event-stream',
        raw: `retry: 600000\n\n${streamFrame('state', { status: 'G', currentTestcase: 3 })}`,
      };
      await page.goto('/submissions/sub-1');
      await expect(page.getByTestId('grading-line')).toBeVisible();
    },
  },
  {
    name: 'submission finished',
    on: 'both',
    enter: async (page, api) => {
      api.signedIn = true;
      await page.goto('/submissions/sub-1');
      await expect(page.getByTestId('score')).toBeVisible();
      await expect(page.getByTestId('grading-line')).toHaveCount(0);
    },
  },
  {
    name: 'submission list with the N new pill',
    on: 'both',
    enter: async (page, api) => {
      api.routes['GET /submissions'] = ({ url }) =>
        url.searchParams.get('pageSize') === '1'
          ? {
              body: {
                data: [submissionItem({ id: 'new' })],
                meta: { page: 1, pageSize: 1, total: 103 },
              },
            }
          : {
              body: {
                data: [submissionItem({ id: 'p2' })],
                meta: { page: 2, pageSize: 50, total: 100 },
              },
            };
      api.routes['GET /events/submissions'] = {
        contentType: 'text/event-stream',
        raw: `retry: 600000\n\n${queuedFrame}`,
      };
      await page.goto('/submissions?page=2');
      await expect(page.getByTestId('new-pill')).toBeVisible({ timeout: SETTLE_TIMEOUT_MS });
    },
  },
  {
    name: 'submission list with the paused hint',
    on: 'both',
    enter: async (page, api) => {
      api.routes['GET /submissions'] = list([submissionItem()]);
      api.routes['GET /events/submissions'] = {
        status: 404,
        body: { error: { code: 'not_found', message: 'x' } },
      };
      await page.goto('/submissions');
      await expect(page.getByTestId('live-paused')).toBeVisible();
    },
  },
];

for (const viewport of AUDIT_VIEWPORTS)
  for (const theme of THEMES)
    for (const state of STATES.filter((candidate) =>
      candidate.on === 'both' ? true : (candidate.on === 'phone') === IS_PHONE(viewport.width),
    ))
      test(`${state.name} has no WCAG 2.1 A/AA violations in ${theme.id}, ${viewport.name}`, async ({
        page,
        api,
      }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await applyTheme(page, api, theme);
        await state.enter(page, api);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme.id);
        // The dock and the sheet sit outside #main, so the audit covers the whole page body.
        expect(await axeViolationsIn(page, 'body')).toEqual([]);
      });
