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
import { mountAndWaitFor } from '../contest-spec-helpers';

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
      ...contestEditorRoutes(),
      ...list(),
      'DELETE /contests/hcmus-w41/announcements/a-1': { status: 204 },
      'POST /contests/hcmus-w41/announcements/a-1/resend': { status: 204 },
    });
    const { wrapper } = await mountAndWaitFor('/admin/contests/hcmus-w41/announcements', LIST_TEXT);
    await button(wrapper, 'Gửi lại').trigger('click');
    await flushPromises();
    expect(calls.some((call) => call.path.endsWith('/resend'))).toBe(true);
    expect(wrapper.text()).toContain('Đã gửi lại thông báo.');
    await button(wrapper, 'Xóa').trigger('click');
    await flushPromises();
    expect(calls.some((call) => call.method === 'DELETE')).toBe(false);
    await confirmDialog('Xóa');
    expect(calls.some((call) => call.method === 'DELETE')).toBe(true);
  });

  it('says whether announcements are also pushed live, from the contest setting', async () => {
    mockApi({
      ...staffViewer(EDIT),
      ...contestEditorRoutes(
        editableContest({ settings: contestSettings({ pushAnnouncements: true }) }),
      ),
      ...list(),
    });
    const on = await mountAndWaitFor(
      '/admin/contests/hcmus-w41/announcements',
      'Đã bật gửi qua kênh trực tiếp.',
    );
    expect(on.wrapper.text()).toContain('Đã bật gửi qua kênh trực tiếp.');
    on.wrapper.unmount();
    mockApi({ ...staffViewer(EDIT), ...contestEditorRoutes(), ...list() });
    const off = await mountAndWaitFor(
      '/admin/contests/hcmus-w41/announcements',
      'Chưa bật gửi qua kênh trực tiếp.',
    );
    expect(off.wrapper.text()).toContain('Chưa bật gửi qua kênh trực tiếp.');
  });

  it('shows Bit asleep when there is no announcement yet', async () => {
    mockApi({ ...staffViewer(EDIT), ...contestEditorRoutes(), ...list([]) });
    const { wrapper } = await mountAndWaitFor(
      '/admin/contests/hcmus-w41/announcements',
      'Chưa có thông báo nào.',
    );
    expect(wrapper.text()).toContain('Chưa có thông báo nào.');
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
