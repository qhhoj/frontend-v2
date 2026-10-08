import { expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import type { Page } from '@playwright/test';
import { AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { adminOk, signInAsStaff } from './fixtures/admin';
import { editableContest } from '../src/test/admin-fixtures/contests';

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

for (const viewport of AUDIT_VIEWPORTS)
  test(`contest general tab is accessible and fits at ${viewport.name}`, async ({ page, api }) => {
    await page.setViewportSize(viewport);
    await openContestEditor(page, api, 'general');
    await expect(page.getByLabel('Tên kỳ thi')).toHaveValue('Chọn đội tuyển HCMUS · Tuần 41');
    expect(await axeViolationsIn(page)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
