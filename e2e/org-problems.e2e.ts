import { expect, test } from './fixtures/api';
import { AUDIT_VIEWPORTS, applyTheme, axeViolationsIn } from './fixtures/audit';
import { installOrgProblems } from './fixtures/f4-api';
import { DESKTOP, PHONE, defineShiftTests } from './fixtures/layout-shift';
import { list } from './fixtures/reply';
import { organizationDetail } from '../src/test/community-fixtures';
import { ORG_PROBLEMS } from '../src/test/f4-fixtures';
import { THEMES } from '../src/theme/registry';

const TAB = '/organizations/lhp/problems';

for (const viewport of AUDIT_VIEWPORTS)
  for (const theme of THEMES)
    test(`the admin's "Bài tập" tab is accessible in ${theme.id} at ${viewport.name}`, async ({
      page,
      api,
    }) => {
      await page.setViewportSize(viewport);
      installOrgProblems(api, { canAdminister: true });
      await applyTheme(page, api, theme);
      await page.goto(TAB);
      await expect(page.getByRole('link', { name: 'Dãy con tăng dài nhất' })).toBeVisible();
      expect(await axeViolationsIn(page)).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    });

test('a member reads the list with the community Bit and no admin controls', async ({
  page,
  api,
}) => {
  installOrgProblems(api, { canAdminister: false });
  await page.goto(TAB);
  await expect(page.getByText('Thành viên thường chỉ đọc', { exact: false })).toBeVisible();
  await expect(
    page.getByTestId('org-problems-tab').getByTestId('inline-bit').first(),
  ).toBeVisible();
  await expect(page.getByRole('checkbox')).toHaveCount(0);
});

test('a stranger sees the forbidden state with the security Bit', async ({ page, api }) => {
  api.signedIn = true;
  api.routes['GET /organizations/lhp'] = { body: { data: organizationDetail() } };
  await page.goto(TAB);
  await expect(page.locator('[data-testid="state-panel"][data-state="forbidden"]')).toBeVisible();
  await expect(page.locator('[data-bit-variant="security"]')).toBeVisible();
});

test('filters by tag and archive state in the URL; an empty organization shows the asleep Bit', async ({
  page,
  api,
}) => {
  installOrgProblems(api, { canAdminister: true });
  await page.goto(TAB);
  await page.getByTestId('org-problem-list').getByRole('button', { name: 'Đồ thị' }).click();
  await expect(page).toHaveURL(/tag=dt/);
  await page.getByRole('button', { name: 'Đã lưu trữ' }).click();
  await expect(page).toHaveURL(/archived=true/);
  api.routes['GET /organizations/lhp/problems'] = list([]);
  await page.goto(TAB);
  await expect(page.locator('[data-testid="state-panel"][data-state="empty"]')).toBeVisible();
  await expect(page.locator('[data-bit-variant="asleep"]')).toBeVisible();
});

test('archives a row and the list reloads', async ({ page, api }) => {
  installOrgProblems(api, { canAdminister: true });
  api.routes['POST /organizations/lhp/problems/lhp_lis/archive'] = { status: 204 };
  await page.goto(TAB);
  await page.getByRole('button', { name: 'Lưu trữ lhp_lis' }).click();
  await expect
    .poll(
      () =>
        api.requests.filter((request) => request.key === 'GET /organizations/lhp/problems').length,
    )
    .toBeGreaterThan(1);
});

defineShiftTests([
  {
    name: 'organization problem list',
    path: TAB,
    signedIn: true,
    hold: 'GET /organizations/lhp/problems',
    answer: (api) => installOrgProblems(api, { canAdminister: true, rows: ORG_PROBLEMS }),
    parts: (page) => ({ list: page.getByTestId('org-problem-list') }),
    viewports: [PHONE, DESKTOP],
  },
]);

test('an admin adds a tag in the catalogue', async ({ page, api }) => {
  installOrgProblems(api, { canAdminister: true });
  api.routes['POST /organizations/lhp/problem-tags'] = {
    status: 201,
    body: { data: { id: 'tag-new', slug: 'ds', name: 'Cấu trúc dữ liệu', color: 'tag-5' } },
  };
  await page.goto(TAB);
  const catalogue = page.getByTestId('org-tag-catalogue');
  await expect(catalogue.getByText('3 / 100')).toBeVisible();
  await catalogue.getByRole('button', { name: 'Thêm thẻ' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Mã thẻ').fill('ds');
  await dialog.getByLabel('Tên thẻ').fill('Cấu trúc dữ liệu');
  await dialog.getByLabel('Màu 5').check();
  expect(await axeViolationsIn(page)).toEqual([]);
  await dialog.getByRole('button', { name: 'Lưu thẻ', exact: true }).click();
  await expect(dialog).toBeHidden();
});
