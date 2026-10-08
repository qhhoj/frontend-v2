import { expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import type { Page } from '@playwright/test';
import { AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { adminList, adminOk, signInAsStaff } from './fixtures/admin';
import { announcement, editableContest } from '../src/test/admin-fixtures/contests';

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

for (const viewport of AUDIT_VIEWPORTS)
  test(`contest problems tab is accessible and fits at ${viewport.name}`, async ({ page, api }) => {
    await page.setViewportSize(viewport);
    await openContestEditor(page, api, 'problems');
    await expect(page.getByTestId('code').nth(2)).toHaveText('hcmus41c');
    expect(await axeViolationsIn(page)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });

for (const viewport of AUDIT_VIEWPORTS)
  test(`contest announcements tab is accessible and fits at ${viewport.name}`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    api.routes['GET /contests/hcmus-w41/announcements'] = adminList([announcement()], {
      pageSize: 20,
    });
    await openContestEditor(page, api, 'announcements');
    await expect(page.getByRole('heading', { name: 'Làm rõ đề bài C' })).toBeVisible();
    expect(await axeViolationsIn(page)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
