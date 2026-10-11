import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { fail, mockApi, ok, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { confirmDialog, staffViewer } from '@/test/admin-routes';
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
  // The first mount loads the lazy admin shell chunk.
  vi.setConfig({ testTimeout: 20_000 });

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
});
