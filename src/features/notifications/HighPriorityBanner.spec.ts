import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { staffViewer } from '@/test/admin-routes';
import { mockApi, noContent, page } from '@/test/mock-api';
import type { ApiCall, MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { notificationItem } from '@/test/notification-fixtures';
import { postEditorRoutes } from '@/test/community-routes';
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
  it('goes away once marked read', async () => {
    let isRead = false;
    const calls = mockApi({
      ...signedInViewer(),
      ...postEditorRoutes,
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

  it('offers no mark-read button while viewing as another user', async () => {
    mockApi({
      ...signedInViewer({ impersonatorId: '0192a000-0000-7000-8000-00000000a001' }),
      ...postEditorRoutes,
      'GET /notifications': inbox(() => false),
    });
    await mountApp(START);
    expect(banner()!.textContent).not.toContain('Đánh dấu đã đọc');
  });

  it('stays off the admin layout', async () => {
    mockApi({
      ...staffViewer(['judge.change_ticket']),
      'GET /notifications': inbox(() => false),
    });
    const { wrapper } = await mountApp('/admin');
    await vi.waitFor(() => {
      if (!wrapper.find('[data-testid="admin-topbar"]').exists()) throw new Error('shell not yet');
    });
    expect(banner()).toBeNull();
  });
});
