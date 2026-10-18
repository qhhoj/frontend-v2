import { expect, test } from './fixtures/api';
import { AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { adminList, adminOk, confirmInDialog, dialogOf, signInAsStaff } from './fixtures/admin';
import { activityLog, activitySummary, liveActivity } from '../src/test/admin-fixtures/activity';

const PERMISSIONS = ['judge.can_see_user_activity'];

const mockActivity = (api: Parameters<typeof signInAsStaff>[0]) => {
  signInAsStaff(api, PERMISSIONS);
  api.routes['GET /admin/user-activity/logs'] = adminList(
    [
      activityLog(),
      activityLog({ id: 'l-2', username: null, path: '/wp-login.php', statusCode: 404 }),
    ],
    { hasMore: true },
  );
  api.routes['GET /admin/user-activity/live'] = adminOk(liveActivity());
  api.routes['GET /admin/user-activity/users/tuan_k/summary'] = adminOk(activitySummary());
};

for (const viewport of AUDIT_VIEWPORTS)
  test(`activity page with a summary is accessible and fits at ${viewport.name}`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    mockActivity(api);
    await page.goto('/admin/activity?summary=tuan_k&ip=27.69&days=30');
    await expect(page.getByTestId('user-summary')).toContainText('3.482 yêu cầu');
    await expect(page.getByTestId('activity-table')).toContainText('khách');
    expect(await axeViolationsIn(page)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });

test('the CSV link carries the filter in the page URL', async ({ page, api }) => {
  mockActivity(api);
  await page.goto('/admin/activity?ip=27.69&days=30');
  await expect(page.getByRole('link', { name: 'Xuất CSV' })).toHaveAttribute(
    'href',
    '/api/internal/admin/user-activity/logs/export?ip=27.69&days=30',
  );
});

test('deleting a user’s logs names the user and runs only after the confirm', async ({
  page,
  api,
}) => {
  mockActivity(api);
  api.routes['DELETE /admin/user-activity/users/tuan_k'] = { status: 204 };
  await page.goto('/admin/activity?summary=tuan_k');
  await page.getByRole('button', { name: 'Xóa nhật ký của tuan_k' }).click();
  await expect(dialogOf(page)).toContainText('tuan_k');
  await expect(dialogOf(page)).toContainText('không hoàn tác');
  expect(api.requestsTo('DELETE /admin/user-activity/users/tuan_k')).toHaveLength(0);
  await confirmInDialog(page, 'Xóa');
  await expect
    .poll(() => api.requestsTo('DELETE /admin/user-activity/users/tuan_k').length)
    .toBe(1);
});
