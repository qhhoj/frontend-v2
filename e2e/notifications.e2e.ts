import type { Page } from '@playwright/test';
import type { NotificationItem } from '../src/api/types/notifications';
import { inboxSample, NOTIFICATION_NOW, notificationItem } from '../src/test/notification-fixtures';
import { THEMES } from '../src/theme/registry';
import { expect, list, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { AUDIT_VIEWPORTS } from './fixtures/audit';
import { ok } from './fixtures/reply';
import type { Reply } from './fixtures/reply';

const NOT_FOUND: Reply = { status: 404, body: { error: { code: 'not_found', message: 'x' } } };

const byState = (rows: NotificationItem[], state: string | null) =>
  rows.filter((row) => (state === 'unread' ? row.unread : state === 'read' ? !row.unread : true));

function withInbox(api: FakeApi, rows: NotificationItem[] = inboxSample()) {
  api.signedIn = true;
  api.routes['GET /notifications/unread-count'] = ok({ count: byState(rows, 'unread').length });
  // The banner asks `priority=high`: answer only the high rows, as the backend does.
  api.routes['GET /notifications'] = ({ url }) =>
    list(
      byState(rows, url.searchParams.get('state')).filter(
        (row) => url.searchParams.get('priority') !== 'high' || row.priority === 'high',
      ),
    );
  api.routes['POST /notifications/:id/read'] = { status: 204 };
  api.routes['POST /notifications/read-all'] = { status: 204 };
}
const bellOf = (page: Page) => page.getByTestId('notification-bell');
const drawerOf = (page: Page) => page.getByRole('dialog', { name: 'Thông báo' });

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOTIFICATION_NOW);
});

test('the bell opens the latest notifications, marks one read and gives focus back on Escape', async ({
  page,
  api,
}) => {
  withInbox(api);
  const first = inboxSample()[0];
  await page.goto('/notifications');
  await expect(bellOf(page)).toHaveAccessibleName('Thông báo, 3 chưa đọc');
  await bellOf(page).click();
  await expect(drawerOf(page).getByText('Hôm nay')).toBeVisible();
  await drawerOf(page)
    .getByRole('button', { name: `Đánh dấu đã đọc: ${first.title}` })
    .click();
  await expect.poll(() => api.requestsTo(`POST /notifications/${first.id}/read`).length).toBe(1);
  await page.keyboard.press('Escape');
  await expect(drawerOf(page)).toBeHidden();
  await expect(bellOf(page)).toBeFocused();
});

test('see all opens the page and the unread filter narrows it', async ({ page, api }) => {
  withInbox(api);
  await page.goto('/blog');
  await bellOf(page).click();
  await drawerOf(page).getByRole('link', { name: 'Xem tất cả thông báo' }).click();
  await expect(page).toHaveURL(/\/notifications$/);
  await page
    .getByRole('navigation', { name: 'Trạng thái' })
    .getByRole('link', { name: /Chưa đọc/ })
    .click();
  await expect(page).toHaveURL(/state=unread/);
  await expect(page.locator('main [data-testid="notification-row"]')).toHaveCount(3);
});

test('read all is sent once and confirmed with the crowned Bit', async ({ page, api }) => {
  withInbox(api);
  await page.goto('/notifications');
  await page.getByRole('button', { name: 'Đánh dấu tất cả đã đọc' }).dblclick();
  await expect(page.getByText('Đã đánh dấu tất cả là đã đọc.')).toBeVisible();
  expect(api.requestsTo('POST /notifications/read-all')).toHaveLength(1);
  await expect(page.locator('main [data-testid="inline-bit"]').first()).toBeVisible();
});

test('a notification whose ticket is gone stays as an old notification', async ({ page, api }) => {
  const gone = notificationItem({ id: 'n-gone', path: '/tickets/t-gone', title: 'Phiếu đã xóa' });
  withInbox(api, [gone]);
  api.routes['GET /tickets/t-gone'] = NOT_FOUND;
  await page.goto('/notifications');
  await page.locator('main [data-testid="notification-row"] button').first().click();
  await expect(page.locator('main [data-testid="notification-row"]')).toContainText('Thông báo cũ');
  await expect(page).toHaveURL(/\/notifications$/);
});

for (const {} of AUDIT_VIEWPORTS)
  for (const {} of THEMES) {
  }
