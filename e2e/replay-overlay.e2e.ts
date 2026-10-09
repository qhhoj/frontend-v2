import type { Page } from '@playwright/test';
import { participationSummary } from '../src/test/fixtures';
import { VIRTUAL_PARTICIPATION_ID } from '../src/test/replay-fixtures';
import { THEMES } from '../src/theme/registry';
import { expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { applyTheme, AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { defineShiftTests, PHONE_AND_DESKTOP } from './fixtures/layout-shift';
import { ok } from './fixtures/reply';

const NOW = new Date('2026-10-09T10:25:00Z');
const RANKING = '/contests/r41/ranking';
const fitsWidth = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
/** Signed in, in the 25th minute of a virtual run of r41. */
const inVirtualRun = (api: FakeApi) => {
  api.signedIn = true;
  api.routes['GET /contests/current'] = ok({
    contest: {
      key: 'r41',
      name: 'QHH Round #41',
      startTime: '2026-10-01T08:00:00Z',
      endTime: '2026-10-01T11:00:00Z',
    },
    participation: participationSummary({
      id: VIRTUAL_PARTICIPATION_ID,
      virtual: 1,
      realStart: '2026-10-09T10:00:00Z',
      endTime: '2026-10-09T13:00:00Z',
    }),
  });
};

test('a virtual contestant compares the run with the real board at the same elapsed time', async ({
  page,
  api,
}) => {
  await page.clock.setFixedTime(NOW);
  inVirtualRun(api);
  await page.goto(RANKING);
  await page.getByRole('button', { name: 'So với bảng thật' }).click();
  await expect(page).toHaveURL(/compare=1/);
  await expect(page.locator('[data-overlay-part="summary"]')).toHaveText(
    'Bạn xếp thứ 4 · bảng thật xếp thứ 3',
  );
  await expect(
    page.locator('[data-overlay-part="summary"] [data-testid="inline-bit"]'),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Lượt ảo của bạn · 00:25:00' })).toBeVisible();
  await expect(page.locator('tr[data-kind="virtual"]')).toContainText('(ảo)');
});

for (const viewport of AUDIT_VIEWPORTS)
  for (const theme of THEMES)
    test(`the overlay is accessible in ${theme.id} at ${viewport.name}`, async ({ page, api }) => {
      await page.setViewportSize(viewport);
      await page.clock.setFixedTime(NOW);
      inVirtualRun(api);
      await applyTheme(page, api, theme);
      await page.goto(`${RANKING}?compare=1`);
      await expect(page.locator('tr[data-kind="virtual"]')).toBeVisible();
      expect(await axeViolationsIn(page)).toEqual([]);
      expect(await fitsWidth(page)).toBe(true);
    });

defineShiftTests([
  {
    name: 'virtual overlay',
    path: `${RANKING}?compare=1`,
    signedIn: true,
    hold: 'GET /contests/r41/replay',
    answer: inVirtualRun,
    clockAt: NOW,
    parts: (page) => ({
      summary: page.locator('[data-overlay-part="summary"]'),
      panels: page.locator('[data-overlay-part="panels"]'),
    }),
    viewports: PHONE_AND_DESKTOP,
    placedOnly: ['panels'],
    placed: ['panels'],
  },
]);
