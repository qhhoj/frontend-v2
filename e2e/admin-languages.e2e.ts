import type { Page } from '@playwright/test';
import { expect, test } from './fixtures/api';
import { AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { adminOk, signInAsStaff } from './fixtures/admin';
import { JUDGE_FLEET } from '../src/test/admin-fixtures/judges';
import { LANGUAGES } from '../src/test/admin-fixtures/languages';

const PERMISSIONS = ['judge.change_language', 'judge.change_judge'];

const fitsWidth = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

for (const viewport of AUDIT_VIEWPORTS)
  test(`languages with judge coverage at ${viewport.name}: accessible and fits`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    signInAsStaff(api, PERMISSIONS);
    api.routes['GET /admin/languages'] = adminOk(LANGUAGES);
    api.routes['GET /judges'] = adminOk(JUDGE_FLEET);
    await page.goto('/admin/languages');
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('cell', { name: '5 / 5' }).first()).toBeVisible();
    await expect(page.getByText('PAS chỉ chạy trên một máy')).toBeVisible();
    expect(await axeViolationsIn(page)).toEqual([]);
    expect(await fitsWidth(page)).toBe(true);
  });
