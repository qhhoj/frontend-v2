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

const PATH = '/admin/contests/hcmus-w41/actions';
const fitsWidth = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
const endedEditor = (api: FakeApi) => {
  signInAsStaff(api, ['judge.edit_own_contest']);
  api.routes['GET /contests/hcmus-w41'] = adminOk(editableContest({ phase: 'ended' }));
  api.routes['GET /contests/hcmus-w41/data'] = adminOk(contestDataStatus());
  api.routes['GET /contests/hcmus-w41/actions'] = adminOk(contestActions());
};

test('an editor rebuilds the replay of an ended contest and sees it queued', async ({
  page,
  api,
}) => {
  endedEditor(api);
  api.routes['POST /contests/hcmus-w41/replay/rebuild'] = () => {
    api.routes['GET /contests/hcmus-w41/actions'] = adminOk(contestActions({ replay: 'queued' }));
    return { status: 202, body: { data: { queued: true } } };
  };
  await page.goto(PATH);
  const card = page.getByTestId('action-replay');
  await card.getByRole('button', { name: 'Dựng lại bản phát lại' }).click();
  await confirmInDialog(page, 'Dựng lại');
  await expect(card.getByRole('status')).toContainText('Đang chờ trong hàng chạy nền');
  await expect(card.locator('[data-placement="queued"]')).toBeVisible();
});

for (const viewport of AUDIT_VIEWPORTS)
  for (const theme of THEMES)
    test(`the actions tab with the rebuild card is accessible in ${theme.id} at ${viewport.name}`, async ({
      page,
      api,
    }) => {
      await page.setViewportSize(viewport);
      endedEditor(api);
      await applyTheme(page, api, theme);
      await page.goto(PATH);
      await expect(page.getByTestId('action-replay').getByRole('button')).toBeVisible();
      expect(await axeViolationsIn(page)).toEqual([]);
      expect(await fitsWidth(page)).toBe(true);
    });
