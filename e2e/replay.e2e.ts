import type { Page } from '@playwright/test';
import { THEMES } from '../src/theme/registry';
import { buildingChunk, endedContest } from '../src/test/replay-fixtures';
import { expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { applyTheme, AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { defineShiftTests, PHONE_AND_DESKTOP } from './fixtures/layout-shift';
import { ok } from './fixtures/reply';
import type { Reply } from './fixtures/reply';

const REPLAY = '/contests/r41/replay';
const fitsWidth = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
const refusal = (status: number, code: string): Reply => ({
  status,
  body: { error: { code, message: code } },
});

test('the replay plays the board to the end, keeps the second in the link and marks ghosts', async ({
  page,
  api,
}) => {
  api.signedIn = false;
  await page.goto(`${REPLAY}?t=600`);
  await expect(page.getByRole('heading', { name: 'QHH Round #41' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Phát lại' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.locator('tbody tr').first()).toHaveAttribute('data-row-id', 'ghost-0');
  await expect(page.locator('tr[data-kind="ghost"]').last()).toContainText('Không đủ dữ liệu');
  await page.getByLabel('Thời điểm phát lại').fill('10000');
  await expect(page).toHaveURL(/t=10000/);
  await page.getByRole('button', { name: 'x300' }).click();
  await page.getByRole('button', { name: 'Phát', exact: true }).click();
  const finished = page.locator('p:not(.sr-only)').filter({ hasText: 'Đã phát đến cuối.' });
  await expect(finished.getByTestId('inline-bit')).toBeVisible({ timeout: 10_000 });
  await expect(page).toHaveURL(/t=10800/);
});

const STATE_CASES: Array<{
  name: string;
  setUp: (routes: FakeApi['routes']) => void;
  variant: string;
}> = [
  {
    name: 'building',
    setUp: (routes) =>
      (routes['GET /contests/r41/replay'] = { status: 202, body: { data: buildingChunk() } }),
    variant: 'judging',
  },
  {
    name: 'frozen',
    setUp: (routes) => {
      routes['GET /contests/r41'] = ok(endedContest({ frozenLastMinutes: 60 }));
      routes['GET /contests/r41/replay'] = refusal(403, 'forbidden');
    },
    variant: 'security',
  },
  {
    name: 'not ready',
    setUp: (routes) => (routes['GET /contests/r41/replay'] = refusal(404, 'replay_not_ready')),
    variant: 'asleep',
  },
  {
    name: 'unsupported',
    setUp: (routes) =>
      (routes['GET /contests/r41'] = ok(endedContest({ formatName: 'final_submission' }))),
    variant: 'sweat',
  },
];

for (const stateCase of STATE_CASES)
  for (const viewport of AUDIT_VIEWPORTS)
    test(`the replay ${stateCase.name} state shows Bit and is accessible at ${viewport.name}`, async ({
      page,
      api,
    }) => {
      await page.setViewportSize(viewport);
      stateCase.setUp(api.routes);
      await page.goto(REPLAY);
      await expect(
        page.locator(`[data-testid="replay-state"] [data-bit-variant="${stateCase.variant}"]`),
      ).toBeVisible();
      expect(await axeViolationsIn(page)).toEqual([]);
      expect(await fitsWidth(page)).toBe(true);
    });

for (const viewport of AUDIT_VIEWPORTS)
  for (const theme of THEMES)
    test(`the replay board is accessible in ${theme.id} at ${viewport.name}`, async ({
      page,
      api,
    }) => {
      await page.setViewportSize(viewport);
      await applyTheme(page, api, theme);
      await page.goto(`${REPLAY}?t=1080`);
      await expect(page.locator('tbody tr')).toHaveCount(6);
      expect(await axeViolationsIn(page)).toEqual([]);
      expect(await fitsWidth(page)).toBe(true);
    });

defineShiftTests([
  {
    name: 'replay page',
    path: REPLAY,
    signedIn: false,
    hold: 'GET /contests/r41/replay',
    parts: (page) => ({
      player: page.locator('[data-replay-part="player"]'),
      board: page.locator('[data-replay-part="board"]'),
      feed: page.locator('[data-replay-part="feed"]'),
    }),
    viewports: PHONE_AND_DESKTOP,
    placedOnly: ['board', 'feed'],
    placed: ['board'],
  },
]);
