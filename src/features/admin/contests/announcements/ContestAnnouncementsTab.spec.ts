import { describe, expect, it } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import type { mountApp } from '@/test/mount';
import { invalid, issue, mockApi, ok, page } from '@/test/mock-api';
import { vi } from 'vitest';
import { confirmDialog, staffViewer } from '@/test/admin-routes';
import {
  announcement,
  contestEditorRoutes,
  contestSettings,
  editableContest,
} from '@/test/admin-fixtures/contests';
import { mountAndWaitFor } from '@/test/admin-contest-mount';

const EDIT = ['judge.edit_own_contest'];
const list = (items = [announcement()]) => ({
  'GET /contests/hcmus-w41/announcements': page(items, { pageSize: 20 }),
});
const button = (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper'], text: string) =>
  wrapper.findAll('button').find((candidate) => candidate.text() === text)!;
const LIST_TEXT = 'Làm rõ đề bài C';

describe('ContestAnnouncementsTab', () => {
  it('posts an announcement and refreshes the list', async () => {
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...contestEditorRoutes(),
      ...list(),
      'POST /contests/hcmus-w41/announcements': ok(announcement({ id: 'new' })),
    });
    const { wrapper } = await mountAndWaitFor('/admin/contests/hcmus-w41/announcements', LIST_TEXT);
    await wrapper.get('#announcement-title').setValue('Làm rõ đề bài C');
    await wrapper.get('#announcement-body').setValue('Đồ thị có thể có cạnh song song.');
    await button(wrapper, 'Đăng thông báo').trigger('click');
    await flushPromises();
    expect(calls.find((call) => call.method === 'POST')?.body).toEqual({
      title: 'Làm rõ đề bài C',
      description: 'Đồ thị có thể có cạnh song song.',
    });
    expect(
      calls.filter((call) => call.path.endsWith('/announcements') && call.method === 'GET'),
    ).toHaveLength(2);
    expect((wrapper.get('#announcement-title').element as HTMLInputElement).value).toBe('');
  });

  it('keeps the draft and marks the title when the backend refuses it', async () => {
    mockApi({
      ...staffViewer(EDIT),
      ...contestEditorRoutes(),
      ...list(),
      'POST /contests/hcmus-w41/announcements': invalid(issue('title', 'max_length', 'too long')),
    });
    const { wrapper } = await mountAndWaitFor('/admin/contests/hcmus-w41/announcements', LIST_TEXT);
    await wrapper.get('#announcement-title').setValue('x'.repeat(101));
    await button(wrapper, 'Đăng thông báo').trigger('click');
    await flushPromises();
    expect(wrapper.get('#announcement-title').attributes('aria-invalid')).toBe('true');
    expect((wrapper.get('#announcement-title').element as HTMLInputElement).value).toHaveLength(
      101,
    );
  });

  it('deletes only after confirming, and resends without asking', async () => {
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...contestEditorRoutes(
        editableContest({ settings: contestSettings({ pushAnnouncements: true }) }),
      ),
      ...list(),
      'DELETE /contests/hcmus-w41/announcements/a-1': { status: 204 },
      'POST /contests/hcmus-w41/announcements/a-1/resend': { status: 204 },
    });
    const { wrapper } = await mountAndWaitFor('/admin/contests/hcmus-w41/announcements', LIST_TEXT);
    await button(wrapper, 'Gửi lại cho những người chưa nhận được').trigger('click');
    await flushPromises();
    expect(calls.some((call) => call.path.endsWith('/resend'))).toBe(true);
    expect(wrapper.text()).toContain('Đã gửi lại cho những người chưa nhận được.');
    await button(wrapper, 'Xóa').trigger('click');
    await flushPromises();
    expect(calls.some((call) => call.method === 'DELETE')).toBe(false);
    await confirmDialog('Xóa');
    expect(calls.some((call) => call.method === 'DELETE')).toBe(true);
  });

  it('refreshes the public announcement cache and moves focus to the composer heading after a delete', async () => {
    mockApi({
      ...staffViewer(EDIT),
      ...contestEditorRoutes(),
      ...list(),
      'DELETE /contests/hcmus-w41/announcements/a-1': { status: 204 },
    });
    const { wrapper, queryClient } = await mountAndWaitFor(
      '/admin/contests/hcmus-w41/announcements',
      LIST_TEXT,
    );
    const publicKey = ['contests', 'announcements', 'viewer', 'hcmus-w41', 1];
    queryClient.setQueryData(publicKey, { items: [] });
    await button(wrapper, 'Xóa').trigger('click');
    await confirmDialog('Xóa');
    await vi.waitFor(() => expect(queryClient.getQueryState(publicKey)?.isInvalidated).toBe(true));
    await vi.waitFor(() =>
      expect(document.activeElement).toBe(document.getElementById('announcement-compose-heading')),
    );
  });

  it('goes back one page when a delete empties a later page, so the pager stays', async () => {
    let remaining = 21;
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...contestEditorRoutes(),
      'GET /contests/hcmus-w41/announcements': (call) =>
        call.query.get('page') === '2'
          ? page(remaining === 21 ? [announcement({ id: 'a-21', title: 'Trang hai' })] : [], {
              page: 2,
              pageSize: 20,
              total: remaining,
            })
          : page([announcement()], { page: 1, pageSize: 20, total: remaining }),
      'DELETE /contests/hcmus-w41/announcements/a-21': () => {
        remaining = 20;
        return { status: 204 };
      },
    });
    const { wrapper, router } = await mountAndWaitFor(
      '/admin/contests/hcmus-w41/announcements?page=2',
      'Trang hai',
    );
    await button(wrapper, 'Xóa').trigger('click');
    await confirmDialog('Xóa');
    await vi.waitFor(() => expect(router.currentRoute.value.query.page).toBe('1'));
    await flushPromises();
    expect(wrapper.text()).toContain('20 thông báo · trang 1 của 1');
    expect(wrapper.text()).toContain('Làm rõ đề bài C');
    expect(calls.some((call) => call.method === 'DELETE')).toBe(true);
  });
});
