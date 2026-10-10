import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { fail, mockApi, ok, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { cancelDialog, confirmDialog, staffViewer } from '@/test/admin-routes';
import { communityId, postItem } from '@/test/community-fixtures';

const PERMS = ['judge.edit_all_post'];
/** The screen is a lazy route: the tabs are there once its chunk has loaded. */
async function mountModeration(path: string) {
  const mounted = await mountApp(path);
  await vi.waitFor(() =>
    expect(
      mounted.wrapper.find('nav[aria-label="Danh sách bài viết"] a[aria-current]').exists(),
    ).toBe(true),
  );
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
      'GET /admin/posts': page([]),
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
    const { wrapper, router } = await mountModeration('/admin/posts?feed=hidden');
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
    // The hidden queue is on every tab (its count), so hiding a post refetches it: it shows the post gone.
    expect(calls.filter((call) => call.path === '/admin/posts')).toHaveLength(2);
  });

  it('reads a repeated ?page= as its first value', async () => {
    const calls = mockApi({
      ...staffViewer(PERMS),
      'GET /posts': page([postItem()]),
      'GET /admin/posts': page([]),
    });
    await mountModeration('/admin/posts?page=2&page=3');
    expect(calls.find((call) => call.path === '/posts')!.query.get('page')).toBe('2');
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
      .findAll('nav[aria-label="Danh sách bài viết"] a')
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

const hiddenPost = (overrides = {}) =>
  postItem({
    id: 'h-1',
    title: 'Lời giải bài Cây khung nhỏ nhất',
    visible: false,
    authors: [{ id: communityId(910), username: 'bao_ly', rating: null }],
    publishOn: '2026-10-06T22:10:00Z',
    score: 2,
    commentCount: 0,
    ...overrides,
  });
const hiddenRoutes = (post = hiddenPost(), extra = {}) => ({
  ...staffViewer(PERMS),
  'GET /posts': page([]),
  'GET /admin/posts': page([post], { total: 3 }),
  ...extra,
});
/** A public list the page does not show on this tab: it must still be marked stale. */
const PUBLIC_LIST_KEY = ['posts', 'list', 'all', 1, 'anonymous'];
type Mounted = Awaited<ReturnType<typeof mountApp>>;
const rowButton = (wrapper: Mounted['wrapper'], label: string) =>
  wrapper.findAll('button').find((button) => button.text() === label)!;

describe('BlogModerationPage unhide', () => {
  it('offers "Hiện lại" on the hidden queue only, and "Ẩn bài" only on the visible lists', async () => {
    mockApi(hiddenRoutes());
    const hidden = await mountModeration('/admin/posts?feed=hidden');
    const hiddenLabels = hidden.wrapper.findAll('button').map((button) => button.text());
    expect(hiddenLabels).toContain('Hiện lại');
    expect(hiddenLabels).not.toContain('Ẩn bài');
    mockApi({ ...hiddenRoutes(), 'GET /posts': page([postItem()]) });
    const visible = await mountModeration('/admin/posts');
    const visibleLabels = visible.wrapper.findAll('button').map((button) => button.text());
    expect(visibleLabels).not.toContain('Hiện lại');
  });

  it('names the post in the confirm, sends nothing before it, then shows the post and refreshes both lists', async () => {
    const calls = mockApi(hiddenRoutes(hiddenPost(), { 'PATCH /posts/h-1': ok({}) }));
    const { wrapper, queryClient } = await mountModeration('/admin/posts?feed=hidden');
    queryClient.setQueryData(PUBLIC_LIST_KEY, { items: [], meta: { page: 1, pageSize: 10 } });
    await rowButton(wrapper, 'Hiện lại').trigger('click');
    await flushPromises();
    const dialog = document.body.querySelector('[role="dialog"]')!.textContent;
    expect(dialog).toContain('Hiện lại bài viết?');
    expect(dialog).toContain('Lời giải bài Cây khung nhỏ nhất');
    expect(dialog).toContain('bao_ly');
    expect(dialog).toContain('Bài hiện ngay ở bảng tin và các danh sách công khai.');
    expect(dialog).not.toContain('Hẹn giờ');
    expect(calls.some((call) => call.method === 'PATCH')).toBe(false);
    await confirmDialog('Hiện lại');
    expect(calls.find((call) => call.method === 'PATCH')?.body).toEqual({ visible: true });
    expect(calls.filter((call) => call.path === '/admin/posts')).toHaveLength(2);
    expect(queryClient.getQueryState(PUBLIC_LIST_KEY)?.isInvalidated).toBe(true);
  });

  it('warns when the publish time is still ahead and relabels the confirm', async () => {
    const scheduled = hiddenPost({ title: 'Đề thi thử vòng 2', publishOn: '2099-01-01T08:00:00Z' });
    const calls = mockApi(hiddenRoutes(scheduled, { 'PATCH /posts/h-1': ok({}) }));
    const { wrapper } = await mountModeration('/admin/posts?feed=hidden');
    await rowButton(wrapper, 'Hiện lại').trigger('click');
    await flushPromises();
    expect(document.body.querySelector('[role="dialog"]')!.textContent).toContain(
      'Bài chuyển sang tab Hẹn giờ',
    );
    await confirmDialog('Hiện lại, hẹn giờ');
    expect(calls.find((call) => call.method === 'PATCH')?.body).toEqual({ visible: true });
  });

  it('keeps the dialog open with the reason when the backend refuses, and the post stays hidden', async () => {
    mockApi(hiddenRoutes(hiddenPost(), { 'PATCH /posts/h-1': fail(403, 'forbidden') }));
    const { wrapper } = await mountModeration('/admin/posts?feed=hidden');
    await rowButton(wrapper, 'Hiện lại').trigger('click');
    await flushPromises();
    await confirmDialog('Hiện lại');
    expect(document.body.querySelector('[role="dialog"] [role="alert"]')!.textContent).toContain(
      'Bạn không có quyền làm việc này.',
    );
    expect(wrapper.text()).toContain('Lời giải bài Cây khung nhỏ nhất');
  });

  it('marks the open feed as the current page and not as a tab', async () => {
    mockApi(hiddenRoutes());
    const { wrapper } = await mountModeration('/admin/posts?feed=hidden');
    expect(wrapper.find('[role="tab"], [role="tablist"]').exists()).toBe(false);
    const current = wrapper.findAll('nav[aria-label="Danh sách bài viết"] a[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0]!.text()).toContain('Đã ẩn');
  });

  it('gives the official-contest lock its own text, and keeps the post hidden', async () => {
    mockApi(
      hiddenRoutes(hiddenPost(), {
        'PATCH /posts/h-1': fail(403, 'forbidden', undefined, undefined, {
          message: 'Blog posts are locked during the official contest',
        }),
      }),
    );
    const { wrapper } = await mountModeration('/admin/posts?feed=hidden');
    await rowButton(wrapper, 'Hiện lại').trigger('click');
    await flushPromises();
    await confirmDialog('Hiện lại');
    const text = document.body.querySelector('[role="dialog"] [role="alert"]')!.textContent;
    expect(text).toContain('thi chính thức');
    expect(text).not.toContain('Bạn không có quyền làm việc này.');
  });

  it('moves focus to the open feed tab after a post is shown again', async () => {
    mockApi(hiddenRoutes(hiddenPost(), { 'PATCH /posts/h-1': ok({}) }));
    const { wrapper } = await mountModeration('/admin/posts?feed=hidden');
    await rowButton(wrapper, 'Hiện lại').trigger('click');
    await flushPromises();
    await confirmDialog('Hiện lại');
    await vi.waitFor(() =>
      expect(document.activeElement).toBe(
        wrapper.get('nav[aria-label="Danh sách bài viết"] a[aria-current="page"]').element,
      ),
    );
  });

  it('moves focus to the open feed tab after a post is hidden', async () => {
    mockApi({
      ...staffViewer(PERMS),
      'GET /posts': page([postItem({ id: 'p-2', title: 'Bán tài khoản VIP' })]),
      'GET /admin/posts': page([]),
      'PATCH /posts/p-2': ok({}),
    });
    const { wrapper } = await mountModeration('/admin/posts');
    await rowButton(wrapper, 'Ẩn bài').trigger('click');
    await flushPromises();
    await confirmDialog('Ẩn bài');
    await vi.waitFor(() =>
      expect(document.activeElement).toBe(
        wrapper.get('nav[aria-label="Danh sách bài viết"] a[aria-current="page"]').element,
      ),
    );
  });

  it('does not pull focus to the feed tab when the hide is refused and the row stays', async () => {
    mockApi({
      ...staffViewer(PERMS),
      'GET /posts': page([postItem({ id: 'p-2', title: 'Bán tài khoản VIP' })]),
      'GET /admin/posts': page([]),
      'PATCH /posts/p-2': fail(403, 'forbidden'),
    });
    const { wrapper } = await mountModeration('/admin/posts');
    await rowButton(wrapper, 'Ẩn bài').trigger('click');
    await flushPromises();
    await confirmDialog('Ẩn bài');
    await flushPromises();
    await vi.waitFor(() => expect(wrapper.text()).toContain('Bạn không có quyền làm việc này.'));
    expect(document.activeElement).not.toBe(
      wrapper.get('nav[aria-label="Danh sách bài viết"] a[aria-current="page"]').element,
    );
  });

  it('cancelling the confirm sends nothing', async () => {
    const calls = mockApi(hiddenRoutes());
    const { wrapper } = await mountModeration('/admin/posts?feed=hidden');
    await rowButton(wrapper, 'Hiện lại').trigger('click');
    await flushPromises();
    await cancelDialog();
    expect(calls.some((call) => call.method === 'PATCH')).toBe(false);
  });

  it('shows how many posts are hidden on the "Đã ẩn" tab, also while another tab is open', async () => {
    mockApi({ ...hiddenRoutes(), 'GET /posts': page([postItem()]) });
    const { wrapper } = await mountModeration('/admin/posts');
    expect(wrapper.get('[data-testid="hidden-count"]').text()).toBe('3');
  });
});
