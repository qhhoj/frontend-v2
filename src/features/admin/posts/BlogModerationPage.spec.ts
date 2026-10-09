import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi, ok, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { confirmDialog, staffViewer } from '@/test/admin-routes';
import { postItem } from '@/test/community-fixtures';

const PERMS = ['judge.edit_all_post'];
/** The screen is a lazy route: the tabs are there once its chunk has loaded. */
async function mountModeration(path: string) {
  const mounted = await mountApp(path);
  await vi.waitFor(() => expect(mounted.wrapper.find('[role="tablist"]').exists()).toBe(true));
  return mounted;
}

describe('BlogModerationPage', () => {
  it('lists every personal post by default with pin and global marks and the score', async () => {
    const calls = mockApi({
      ...staffViewer(PERMS),
      'GET /posts': page([
        postItem({ sticky: true, globalPost: true }),
        postItem({ id: 'p-2', score: -7 }),
      ]),
    });
    const { wrapper } = await mountModeration('/admin/posts');
    expect(calls.find((call) => call.path === '/posts')!.query.get('feed')).toBe('all');
    expect(wrapper.text()).toContain('Ghim');
    expect(wrapper.text()).toContain('Điểm âm');
  });

  it('hides a post after confirming and refreshes both the visible and the hidden lists', async () => {
    const calls = mockApi({
      ...staffViewer(PERMS),
      'GET /posts': page([postItem({ id: 'p-2', title: 'Bán tài khoản VIP' })]),
      'GET /admin/posts': page([]),
      'PATCH /posts/p-2': ok({}),
    });
    const { wrapper, router, queryClient } = await mountModeration('/admin/posts?feed=hidden');
    await router.replace({ query: {} });
    await flushPromises();
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Ẩn bài')!
      .trigger('click');
    await flushPromises();
    expect(document.body.querySelector('[role="dialog"]')?.textContent).toContain(
      'Ẩn “Bán tài khoản VIP”?',
    );
    expect(calls.some((call) => call.method === 'PATCH')).toBe(false);
    await confirmDialog('Ẩn bài');
    expect(calls.find((call) => call.method === 'PATCH')?.body).toEqual({ visible: false });
    expect(calls.filter((call) => call.path === '/posts')).toHaveLength(2);
    // The hidden queue was loaded before and is inactive now: hiding a post must mark it stale.
    const hiddenLists = queryClient.getQueryCache().findAll({ queryKey: ['admin', 'posts'] });
    expect(hiddenLists.some((query) => query.state.isInvalidated)).toBe(true);
  });

  it('shows the hidden and the scheduled queues from the moderation endpoint', async () => {
    const calls = mockApi({
      ...staffViewer(PERMS),
      'GET /admin/posts': ({ query }) =>
        page(
          query.get('state') === 'hidden'
            ? [postItem({ id: 'h-1', title: 'Bản nháp', visible: false })]
            : [
                postItem({
                  id: 's-1',
                  title: 'Hẹn giờ ngày mai',
                  publishOn: '2099-01-01T00:00:00Z',
                }),
              ],
        ),
    });
    const { wrapper } = await mountModeration('/admin/posts?feed=hidden');
    expect(wrapper.text()).toContain('Bản nháp');
    expect(calls.find((call) => call.path === '/admin/posts')!.query.get('state')).toBe('hidden');
    await wrapper
      .findAll('[role="tab"]')
      .find((tab) => tab.text() === 'Hẹn giờ')!
      .trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Hẹn giờ ngày mai');
    expect(
      calls
        .filter((call) => call.path === '/admin/posts')
        .at(-1)!
        .query.get('state'),
    ).toBe('scheduled');
  });
});
