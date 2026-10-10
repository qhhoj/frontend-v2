import { contestDetail, contestViewer } from '../src/test/fixtures';
import { balloon } from '../src/test/contest-extras-fixtures';
import { THEMES } from '../src/theme/registry';
import { AUDIT_VIEWPORTS, applyTheme, axeViolationsIn } from './fixtures/audit';
import { CONTEST_FIXTURE_NOW, expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { ok } from './fixtures/reply';

const queue = [balloon(0), balloon(1), balloon(4)];
function volunteer(api: FakeApi) {
  api.signedIn = true;
  api.routes['GET /contests/r42'] = ok(
    contestDetail({ viewer: contestViewer({ canViewBalloons: true }) }),
  );
  let delivered = false;
  api.routes['GET /contests/r42/balloons'] = () => ({
    body: {
      data: delivered ? queue.slice(1) : queue,
      meta: {
        page: 1,
        pageSize: 50,
        total: delivered ? 2 : 3,
        pendingTotal: delivered ? 2 : 3,
        deliveredTotal: delivered ? 1 : 0,
      },
    },
  });
  api.routes['POST /contests/r42/balloons/:participation/:problem/deliver'] = () => {
    delivered = true;
    return { status: 204 };
  };
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(CONTEST_FIXTURE_NOW);
});

test('a volunteer opens the queue from the contest tabs and delivers a balloon', async ({
  page,
  api,
}) => {
  volunteer(api);
  await page.goto('/contests/r42');
  await page.getByRole('link', { name: 'Bóng bay' }).click();
  await expect(page).toHaveURL(/\/contests\/r42\/balloons$/);
  await expect(page.getByTestId('inline-bit').first()).toBeVisible();
  await expect(page.getByTestId('balloon-row')).toHaveCount(3);
  await page.getByTestId('balloon-row').first().getByRole('button').click();
  await expect(page.getByTestId('balloon-row')).toHaveCount(2);
  await expect(page.getByTestId('pending-total')).toHaveText('2');
});

test('the print sheet has no site header and lists the queue', async ({ page, api }) => {
  volunteer(api);
  await page.goto('/contests/r42/balloons/print');
  await expect(page.getByTestId('print-row')).toHaveCount(3);
  // The site header (with its "Bài tập" link) is not drawn on the sheet.
  await expect(page.getByRole('link', { name: 'Bài tập', exact: true })).toHaveCount(0);
});

test('balloons off shows the crying Bit', async ({ page, api }) => {
  volunteer(api);
  api.routes['GET /contests/r42/balloons'] = {
    status: 404,
    body: { error: { code: 'not_found', message: 'x' } },
  };
  await page.goto('/contests/r42/balloons');
  await expect(page.locator('[data-state="notFound"]')).toBeVisible();
  await expect(page.locator('.bit-tear')).toHaveCount(2);
});

for (const viewport of AUDIT_VIEWPORTS)
  test(`the balloon screen and sheet are accessible in every theme and fit at ${viewport.name}`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    for (const theme of THEMES) {
      volunteer(api);
      await applyTheme(page, api, theme);
      for (const path of ['/contests/r42/balloons', '/contests/r42/balloons/print']) {
        await page.goto(path);
        await expect(
          page.getByTestId(path.endsWith('print') ? 'print-row' : 'balloon-row').first(),
        ).toBeVisible();
        expect(await axeViolationsIn(page), `${theme.id} ${path}`).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
      }
    }
  });
