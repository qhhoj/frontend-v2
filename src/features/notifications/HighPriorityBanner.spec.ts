import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { staffViewer } from '@/test/admin-routes';
import { mockApi, noContent, page } from '@/test/mock-api';
import type { ApiCall, MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { notificationItem } from '@/test/notification-fixtures';
import { signedInViewer } from '@/test/problem-routes';

const START = '/blog/new';
const important = notificationItem({
  id: 'n-high',
  path: '/notifications',
  title: 'Phiếu hỗ trợ có trả lời mới',
});
/** The banner asks `state=unread&priority=high`; any other list read (the page) gets nothing. */
function inbox(isRead: () => boolean): MockHandler {
  return (call: ApiCall) =>
    page(call.query.get('priority') === 'high' && !isRead() ? [important] : [], { pageSize: 20 });
}
const banner = () =>
  document.body.querySelector<HTMLElement>('[data-testid="high-priority-banner"]');

describe('HighPriorityBanner', () => {
  it('shows the newest unread important notification on a public page', async () => {
    const calls = mockApi({ ...signedInViewer(), 'GET /notifications': inbox(() => false) });
    await mountApp(START);
    const highCall = calls.find((call) => call.path === '/notifications')!;
    expect(highCall.query.get('state')).toBe('unread');
    expect(highCall.query.get('priority')).toBe('high');
    expect(banner()!.textContent).toContain('Quan trọng · chưa đọc');
    expect(banner()!.textContent).toContain(important.title);
    expect(banner()!.getAttribute('aria-label')).toBe('Thông báo quan trọng');
  });

  it('sits in an always-mounted alert region so a late arrival is announced', async () => {
    mockApi({ ...signedInViewer(), 'GET /notifications': inbox(() => false) });
    await mountApp(START);
    expect(banner()!.parentElement!.getAttribute('role')).toBe('alert');
  });

  it('keeps the alert region even when nothing is important', async () => {
    mockApi({ ...signedInViewer(), 'GET /notifications': () => page([], { pageSize: 20 }) });
    await mountApp(START);
    expect(banner()).toBeNull();
    expect(document.body.querySelector('[role="alert"]')).not.toBeNull();
  });

  it('goes away once marked read', async () => {
    let isRead = false;
    const calls = mockApi({
      ...signedInViewer(),
      'GET /notifications': inbox(() => isRead),
      'POST /notifications/n-high/read': () => {
        isRead = true;
        return noContent();
      },
    });
    await mountApp(START);
    [...banner()!.querySelectorAll('button')]
      .find((button) => button.textContent?.trim() === 'Đánh dấu đã đọc')!
      .click();
    await flushPromises();
    expect(calls.some((call) => call.path === '/notifications/n-high/read')).toBe(true);
    expect(banner()).toBeNull();
  });

  it('opens the notification from "Xem phiếu" (a ticket kind) and says plain "Xem" for other kinds', async () => {
    mockApi({
      ...signedInViewer(),
      'GET /notifications': inbox(() => false),
      'POST /notifications/n-high/read': noContent(),
    });
    const { router } = await mountApp(START);
    [...banner()!.querySelectorAll('button')]
      .find((button) => button.textContent?.trim() === 'Xem phiếu')!
      .click();
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/notifications'));
  });

  it('says "Xem" when the important notification is not a ticket', async () => {
    mockApi({
      ...signedInViewer(),
      'GET /notifications': () =>
        page([{ ...important, kind: 'contest-announcement' }], { pageSize: 20 }),
    });
    await mountApp(START);
    expect(
      [...banner()!.querySelectorAll('button')].map((button) => button.textContent?.trim()),
    ).toContain('Xem');
  });

  it('offers no mark-read button while viewing as another user', async () => {
    mockApi({
      ...signedInViewer({ impersonatorId: '0192a000-0000-7000-8000-00000000a001' }),
      'GET /notifications': inbox(() => false),
    });
    await mountApp(START);
    expect(banner()!.textContent).not.toContain('Đánh dấu đã đọc');
  });

  it('stays off the admin layout', async () => {
    mockApi({ ...staffViewer(['judge.change_ticket']), 'GET /notifications': inbox(() => false) });
    const { wrapper } = await mountApp('/admin');
    await vi.waitFor(() => {
      if (!wrapper.find('[data-testid="admin-topbar"]').exists()) throw new Error('shell not yet');
    });
    expect(banner()).toBeNull();
  });
});
