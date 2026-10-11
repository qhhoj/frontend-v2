import { expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import type { Page } from '@playwright/test';
import { adminOk, signInAsStaff } from './fixtures/admin';
import { contestDataStatus, editableContest } from '../src/test/admin-fixtures/contests';

export const openContestEditor = async (
  page: Page,
  api: FakeApi,
  tab: string,
  permissions = ['judge.edit_own_contest'],
) => {
  signInAsStaff(api, permissions);
  api.routes['GET /contests/hcmus-w41'] = adminOk(editableContest());
  await page.goto(`/admin/contests/hcmus-w41/${tab}`);
};

test('the rescore button opens its confirm from the keyboard, and Escape returns focus to it', async ({
  page,
  api,
}) => {
  api.routes['GET /contests/hcmus-w41/actions'] = adminOk({
    rescore: 'idle',
    judgeFinal: 'idle',
    rate: 'idle',
  });
  api.routes['GET /contests/hcmus-w41/data'] = adminOk(contestDataStatus());
  await openContestEditor(page, api, 'actions');
  const rescore = page.getByRole('button', { name: 'Tính lại điểm', exact: true });
  await rescore.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(rescore).toBeFocused();
});
