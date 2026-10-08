import { expect, test } from './fixtures/api';
import { AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { signInAsStaff } from './fixtures/admin';

for (const viewport of AUDIT_VIEWPORTS)
  test(`admin home is accessible and fits at ${viewport.name}`, async ({ page, api }) => {
    await page.setViewportSize(viewport);
    signInAsStaff(api, ['judge.add_problem', 'judge.add_contest', 'judge.change_judge']);
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Chào minhthu' })).toBeVisible();
    expect(await axeViolationsIn(page)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });

test('a staff member without the permission keeps the URL and sees why', async ({ page, api }) => {
  signInAsStaff(api, ['judge.add_problem']);
  await page.goto('/admin/judges');
  await expect(page).toHaveURL(/\/admin\/judges$/);
  await expect(page.getByText('judge.change_judge')).toBeVisible();
});

test('the phone nav is a disclosure that opens to the same links', async ({ page, api }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  signInAsStaff(api, ['judge.add_problem']);
  await page.goto('/admin');
  await page.getByText('Mục quản trị').click();
  await page.getByTestId('admin-nav-phone').getByRole('link', { name: 'Bài tập' }).click();
  await expect(page).toHaveURL(/\/admin\/problems$/);
});
