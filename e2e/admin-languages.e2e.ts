import type { Page } from '@playwright/test';
import { expect, test } from './fixtures/api';
import { AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { adminOk, signInAsStaff } from './fixtures/admin';
import { JUDGE_FLEET } from '../src/test/admin-fixtures/judges';
import { LANGUAGES, languageAdmin } from '../src/test/admin-fixtures/languages';

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

const EDITOR_PERMISSIONS = ['judge.change_language', 'judge.add_language'];

for (const viewport of AUDIT_VIEWPORTS)
  test(`create a language at ${viewport.name}: accessible, and Enter in the last box sends one POST`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    signInAsStaff(api, EDITOR_PERMISSIONS);
    api.routes['GET /admin/languages'] = adminOk(LANGUAGES);
    api.routes['POST /admin/languages'] = adminOk(languageAdmin({ key: 'KOTLIN', name: 'Kotlin' }));
    await page.goto('/admin/languages/new');
    await expect(page.getByTestId('language-save-bar')).toBeVisible();
    expect(await axeViolationsIn(page)).toEqual([]);
    await page.getByLabel('Mã ngôn ngữ *', { exact: true }).fill('KOTLIN');
    await page.getByLabel('Tên *', { exact: true }).fill('Kotlin');
    await page.getByLabel('Tên chung *', { exact: true }).fill('Kotlin');
    await page.getByLabel('Chế độ Ace *', { exact: true }).fill('kotlin');
    await page.getByLabel('Pygments *', { exact: true }).fill('kotlin');
    await page.getByLabel('Đuôi tệp *', { exact: true }).fill('kt');
    await page.getByLabel('Đuôi tệp *', { exact: true }).press('Enter');
    await expect(page).toHaveURL(/\/admin\/languages$/);
    expect(api.requestsTo('POST /admin/languages')).toHaveLength(1);
    expect(await fitsWidth(page)).toBe(true);
  });

for (const viewport of AUDIT_VIEWPORTS)
  test(`edit a language at ${viewport.name}: the key is sealed and one changed field is sent`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    signInAsStaff(api, EDITOR_PERMISSIONS);
    const ruby = LANGUAGES.find((language) => language.key === 'RUBY')!;
    api.routes['GET /admin/languages'] = adminOk(LANGUAGES);
    api.routes[`PATCH /admin/languages/${ruby.id}`] = adminOk({ ...ruby, name: 'Ruby 3' });
    await page.goto('/admin/languages/RUBY');
    await expect(page.getByTestId('language-key-sealed')).toContainText('Cố định');
    expect(await axeViolationsIn(page)).toEqual([]);
    await page.getByLabel('Tên *', { exact: true }).fill('Ruby 3');
    await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Đã lưu lúc' })).toBeVisible();
    expect(api.requestsTo(`PATCH /admin/languages/${ruby.id}`)).toHaveLength(1);
  });

test('the save bar stays in view at the phone width on a long form', async ({ page, api }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  signInAsStaff(api, EDITOR_PERMISSIONS);
  api.routes['GET /admin/languages'] = adminOk(LANGUAGES);
  await page.goto('/admin/languages/new');
  await expect(page.getByTestId('language-save-bar')).toBeInViewport();
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.getByTestId('language-save-bar')).toBeInViewport();
});
