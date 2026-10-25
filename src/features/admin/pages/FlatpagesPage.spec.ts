import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { fail, mockApi, ok, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { invalidatedKeys, seedCache } from '@/test/cache-probe';

import { confirmDialog, staffViewer } from '@/test/admin-routes';
import { FLATPAGE_HISTORY, flatpage, flatpageItem } from '@/test/admin-fixtures/flatpages';

const ALL = ['flatpages.add_flatpage', 'flatpages.change_flatpage', 'flatpages.delete_flatpage'];
const routes = (extra = {}) => ({
  ...staffViewer(ALL),
  'GET /admin/site/pages': page([
    flatpageItem(),
    flatpageItem({
      id: 'fp-2',
      url: '/training',
      title: 'Tài liệu đội tuyển',
      registrationRequired: true,
    }),
  ]),
  'GET /admin/site/pages/fp-1': ok(flatpage()),
  'GET /admin/site/pages/fp-1/revisions': page([]),
  ...extra,
});
/** The screen is a lazy route: the list is there once its chunk and its first answer have arrived. */
const mountPages = async (path: string) => {
  const mounted = await mountApp(path);
  await vi.waitFor(() => expect(mounted.wrapper.text()).toContain('2 trang'));
  return mounted;
};
const click = async (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper'], text: string) => {
  await wrapper
    .findAll('button')
    .find((button) => button.text() === text)!
    .trigger('click');
  await flushPromises();
};

describe('FlatpagesPage', () => {
  it('creates a page with the canonical URL and shows a taken URL under the box', async () => {
    let isTaken = true;
    const calls = mockApi(
      routes({
        'POST /admin/site/pages': () =>
          isTaken
            ? fail(409, 'conflict', { url: ['This url is taken.'] })
            : ok(flatpage({ id: 'fp-3', url: '/faq' })),
        'GET /admin/site/pages/fp-3': ok(flatpage({ id: 'fp-3', url: '/faq' })),
        'GET /admin/site/pages/fp-3/revisions': page([]),
      }),
    );
    const { wrapper } = await mountPages('/admin/pages');
    await click(wrapper, 'Trang mới');
    await wrapper.get('#page-url').setValue('faq/');
    await wrapper.get('#page-title').setValue('Câu hỏi thường gặp');
    await click(wrapper, 'Lưu');
    expect(calls.find((call) => call.method === 'POST')?.body).toMatchObject({
      url: '/faq',
      title: 'Câu hỏi thường gặp',
    });
    expect(wrapper.text()).toContain('“/faq” đã có trang khác dùng.');
    isTaken = false;
    await click(wrapper, 'Lưu');
    expect(wrapper.text()).toContain('Đã lưu lúc');
  });

  it('switching pages from the list with unsaved edits asks first; Stay keeps the page and its edits', async () => {
    mockApi(
      routes({
        'GET /admin/site/pages/fp-2': ok(flatpage({ id: 'fp-2', url: '/training' })),
        'GET /admin/site/pages/fp-2/revisions': page([]),
      }),
    );
    const { wrapper, router } = await mountPages('/admin/pages?page=fp-1');
    await vi.waitFor(() => expect(wrapper.find('#page-title').exists()).toBe(true));
    await wrapper.get('#page-title').setValue('Đổi tiêu đề');
    await router.push({ query: { page: 'fp-2' } });
    await flushPromises();
    expect(router.currentRoute.value.query.page).toBe('fp-1');
    expect(document.body.textContent).toContain('Rời trang');
  });

  it('after a create, the page is opened at its id and the next save is an update, never a second create', async () => {
    const created = flatpage({ id: 'fp-3', url: '/faq', title: 'Câu hỏi thường gặp' });
    const calls = mockApi(
      routes({
        'POST /admin/site/pages': ok(created),
        'GET /admin/site/pages/fp-3': ok(created),
        'GET /admin/site/pages/fp-3/revisions': page([]),
        'PATCH /admin/site/pages/fp-3': ok({ ...created, title: 'Câu hỏi mới' }),
      }),
    );
    const { wrapper, router } = await mountPages('/admin/pages');
    await click(wrapper, 'Trang mới');
    await wrapper.get('#page-url').setValue('faq/');
    await wrapper.get('#page-title').setValue('Câu hỏi thường gặp');
    await click(wrapper, 'Lưu');
    expect(router.currentRoute.value.query.page).toBe('fp-3');
    await wrapper.get('#page-title').setValue('Câu hỏi mới');
    await click(wrapper, 'Lưu');
    expect(calls.filter((call) => call.method === 'POST')).toHaveLength(1);
    const patches = calls.filter((call) => call.method === 'PATCH');
    expect(patches.map((call) => call.path)).toEqual(['/admin/site/pages/fp-3']);
    expect(patches[0]?.body).toEqual({ title: 'Câu hỏi mới' });
  });

  it('a save made while the route change to the created page is still pending updates that page', async () => {
    const created = flatpage({ id: 'fp-3', url: '/faq', title: 'Câu hỏi thường gặp' });
    const calls = mockApi(
      routes({
        'POST /admin/site/pages': ok(created),
        'PATCH /admin/site/pages/fp-3': ok({ ...created, title: 'Câu hỏi mới' }),
      }),
    );
    const { wrapper, router } = await mountPages('/admin/pages');
    vi.spyOn(router, 'replace').mockImplementation(() => new Promise<never>(() => {}));
    await click(wrapper, 'Trang mới');
    await wrapper.get('#page-url').setValue('faq/');
    await wrapper.get('#page-title').setValue('Câu hỏi thường gặp');
    await click(wrapper, 'Lưu');
    await wrapper.get('#page-title').setValue('Câu hỏi mới');
    await click(wrapper, 'Lưu');
    expect(calls.filter((call) => call.method === 'POST')).toHaveLength(1);
    expect(calls.find((call) => call.method === 'PATCH')?.path).toBe('/admin/site/pages/fp-3');
  });

  it('shows a newer saved copy in a clean form, and keeps typed text over it', async () => {
    let stored = flatpage();
    mockApi(routes({ 'GET /admin/site/pages/fp-1': () => ok(stored) }));
    const { wrapper, queryClient } = await mountPages('/admin/pages?page=fp-1');
    const refetch = async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'flatpage'] });
      await flushPromises();
    };
    stored = flatpage({ title: 'Do admin khác sửa' });
    await refetch();
    expect((wrapper.get('#page-title').element as HTMLInputElement).value).toBe(
      'Do admin khác sửa',
    );
    await wrapper.get('#page-title').setValue('Đang gõ dở');
    stored = flatpage({ title: 'Lần sửa thứ ba' });
    await refetch();
    expect((wrapper.get('#page-title').element as HTMLInputElement).value).toBe('Đang gõ dở');
  });

  it('deletes after confirming, and hides delete without its permission', async () => {
    const calls = mockApi(routes({ 'DELETE /admin/site/pages/fp-1': { status: 204 } }));
    const { wrapper } = await mountPages('/admin/pages?page=fp-1');
    await click(wrapper, 'Xóa trang');
    expect(calls.some((call) => call.method === 'DELETE')).toBe(false);
    await confirmDialog('Xóa trang');
    expect(calls.some((call) => call.method === 'DELETE')).toBe(true);
    mockApi({ ...routes(), ...staffViewer(['flatpages.change_flatpage']) });
    const second = await mountPages('/admin/pages?page=fp-1');
    expect(second.wrapper.text()).not.toContain('Xóa trang');
  });
});

describe('history', () => {
  const historyRoutes = (extra = {}) =>
    routes({
      'GET /admin/site/pages/fp-1/revisions': page(FLATPAGE_HISTORY, { pageSize: 20 }),
      'POST /admin/site/pages/render-preview': ok({ html: '' }),
      ...extra,
    });

  it('saves what was loaded through the normal update, with only the changed field', async () => {
    const calls = mockApi(
      historyRoutes({
        'GET /admin/site/pages/fp-1': ok(
          flatpage({ title: 'Giới thiệu QHHOJ', content: '- Hơn **1 000** bài tập' }),
        ),
        'PATCH /admin/site/pages/fp-1': ok(flatpage()),
      }),
    );
    const { wrapper } = await mountPages('/admin/pages?page=fp-1&tab=history');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Nạp giá trị cũ')!
      .trigger('click');
    await flushPromises();
    await click(wrapper, 'Lưu');
    expect(calls.find((call) => call.method === 'PATCH')?.body).toEqual({ title: 'Giới thiệu' });
  });

  it('keeps an unsaved edit when the history is looked at and the editor is shown again', async () => {
    mockApi(historyRoutes());
    const { wrapper } = await mountPages('/admin/pages?page=fp-1');
    await wrapper.get('#page-title').setValue('Đang gõ dở');
    await wrapper.get('a[href*="tab=history"]').trigger('click');
    await flushPromises();
    await wrapper
      .findAll('a')
      .find((link) => link.text() === 'Soạn')!
      .trigger('click');
    await flushPromises();
    expect((wrapper.get('#page-title').element as HTMLInputElement).value).toBe('Đang gõ dở');
  });

  it('marks the public flatpage cache stale after a save and after a delete, and drops the deleted page’s history', async () => {
    mockApi(
      routes({
        'PATCH /admin/site/pages/fp-1': ok(flatpage({ title: 'Giới thiệu mới' })),
        'DELETE /admin/site/pages/fp-1': { status: 204 },
      }),
    );
    const { wrapper, queryClient } = await mountPages('/admin/pages?page=fp-1');
    const publicKey = [['flatpages', '/about', 'probe']];
    seedCache(queryClient, publicKey);
    await wrapper.get('#page-title').setValue('Giới thiệu mới');
    await click(wrapper, 'Lưu');
    expect(invalidatedKeys(queryClient, publicKey)).toEqual(publicKey);
    queryClient.setQueryData(['flatpages', '/about', 'probe'], { seeded: true });
    seedCache(queryClient, [['admin', 'flatpage-revisions', 'fp-1', 'probe']]);
    await click(wrapper, 'Xóa trang');
    await confirmDialog('Xóa trang');
    expect(invalidatedKeys(queryClient, publicKey)).toEqual(publicKey);
    expect(
      queryClient.getQueryState(['admin', 'flatpage-revisions', 'fp-1', 'probe']),
    ).toBeUndefined();
  });
});
