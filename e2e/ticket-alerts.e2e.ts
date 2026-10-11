import { sessionResponse, sessionUser } from '../src/test/fixtures';
import { expect, list, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { ok } from './fixtures/reply';
import type { Page } from '@playwright/test';

const asHandler = (api: FakeApi, assignedOpen: number, awaitingStaff: number) => {
  api.signedIn = true;
  api.routes['GET /auth/me'] = ok(
    sessionResponse({ user: sessionUser({ isStaff: true, permissions: ['judge.change_ticket'] }) }),
  );
  api.routes['GET /tickets'] = list([]);
  api.routes['GET /tickets/summary'] = ok({ assignedOpen, awaitingStaff });
};
const strip = (page: Page) => page.getByRole('region', { name: 'Phiếu cần xử lý' });

test("the canned-reply screen is reached from the ticket queue header (moved here from lane C: the link is lane B's file)", async ({
  page,
  api,
}) => {
  asHandler(api, 0, 0);
  api.routes['GET /ticket-canned-replies'] = list([]);
  await page.goto('/admin/tickets');
  await page.getByRole('link', { name: 'Mẫu trả lời' }).click();
  await expect(page).toHaveURL(/\/admin\/tickets\/canned$/);
});

test('a handler sees both counts and reaches the queue from the strip', async ({ page, api }) => {
  asHandler(api, 2, 5);
  await page.goto('/tickets');
  await expect(
    strip(page).getByRole('link', { name: '2 phiếu đang mở giao cho bạn' }),
  ).toBeVisible();
  await expect(
    strip(page).getByRole('link', { name: '5 phiếu đang chờ nhân viên trả lời' }),
  ).toHaveAttribute('href', '/admin/tickets?scope=all&open=1');
  await expect(strip(page).locator('[data-testid="inline-bit"]')).toBeVisible();
});
