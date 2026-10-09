import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { fail, mockApi, ok, page } from '@/test/mock-api';
import type { ApiCall } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { invalidatedKeys, seedCache } from '@/test/cache-probe';

import { confirmDialog, staffViewer } from '@/test/admin-routes';
import {
  FLATPAGE_HISTORY,
  flatpage,
  flatpageItem,
  flatpageRevision,
} from '@/test/admin-fixtures/flatpages';

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
  it('opens a page and previews the saved, sanitised HTML until something is typed', async () => {
    mockApi(routes());
    const { wrapper } = await mountPages('/admin/pages?page=fp-1');
    expect((wrapper.get('#page-title').element as HTMLInputElement).value).toBe('Giới thiệu');
    expect(wrapper.get('[data-testid="preview"]').html()).toContain('<h2>QHHOJ là gì?</h2>');
    expect(wrapper.get('[data-testid="preview-status"]').text()).toBe('Bản đã lưu');
    expect(wrapper.text()).toContain('Cần đăng nhập');
  });

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
    await click(wrapper, 'Lưu trang');
    expect(calls.find((call) => call.method === 'POST')?.body).toMatchObject({
      url: '/faq',
      title: 'Câu hỏi thường gặp',
    });
    expect(wrapper.text()).toContain('“/faq” đã có trang khác dùng.');
    isTaken = false;
    await click(wrapper, 'Lưu trang');
    expect(wrapper.text()).toContain('Đã lưu trang.');
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
    await click(wrapper, 'Lưu trang');
    expect(router.currentRoute.value.query.page).toBe('fp-3');
    await wrapper.get('#page-title').setValue('Câu hỏi mới');
    await click(wrapper, 'Lưu trang');
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
    await click(wrapper, 'Lưu trang');
    await wrapper.get('#page-title').setValue('Câu hỏi mới');
    await click(wrapper, 'Lưu trang');
    expect(calls.filter((call) => call.method === 'POST')).toHaveLength(1);
    expect(calls.find((call) => call.method === 'PATCH')?.path).toBe('/admin/site/pages/fp-3');
  });

  it('refuses a URL made of slashes only before sending, and shows the backend’s invalid_url under the box', async () => {
    const calls = mockApi(
      routes({
        'POST /admin/site/pages': {
          status: 400,
          body: {
            error: {
              code: 'validation_failed',
              message: 'x',
              fields: { url: ['Not a valid page url.'] },
              issues: [{ field: 'url', code: 'invalid_url', message: 'Not a valid page url.' }],
            },
          },
        },
      }),
    );
    const { wrapper } = await mountPages('/admin/pages');
    await click(wrapper, 'Trang mới');
    await wrapper.get('#page-url').setValue('/');
    await wrapper.get('#page-title').setValue('Gốc');
    await click(wrapper, 'Lưu trang');
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
    expect(wrapper.get('#page-url').attributes('aria-invalid')).toBe('true');
  });

  it('deletes after confirming, and hides delete without its permission', async () => {
    const calls = mockApi(routes({ 'DELETE /admin/site/pages/fp-1': { status: 204 } }));
    const { wrapper } = await mountPages('/admin/pages?page=fp-1');
    await click(wrapper, 'Xoá trang');
    expect(calls.some((call) => call.method === 'DELETE')).toBe(false);
    await confirmDialog('Xoá trang');
    expect(calls.some((call) => call.method === 'DELETE')).toBe(true);
    mockApi({ ...routes(), ...staffViewer(['flatpages.change_flatpage']) });
    const second = await mountPages('/admin/pages?page=fp-1');
    expect(second.wrapper.text()).not.toContain('Xoá trang');
  });
});

describe('history', () => {
  const historyRoutes = (extra = {}) =>
    routes({
      'GET /admin/site/pages/fp-1/revisions': page(FLATPAGE_HISTORY, { pageSize: 20 }),
      'POST /admin/site/pages/render-preview': ok({ html: '' }),
      ...extra,
    });

  it('shows the count on the tab and lists the changes, newest first, the first row opened onto its diff', async () => {
    const calls = mockApi(historyRoutes());
    const { wrapper } = await mountPages('/admin/pages?page=fp-1&tab=history');
    expect(calls.find((call) => call.path.endsWith('/revisions'))?.query.get('page')).toBe('1');
    expect(wrapper.get('a[href*="tab=history"]').text()).toContain('3');
    const rows = wrapper.findAll('[data-testid="revision"]');
    expect(rows).toHaveLength(3);
    expect(rows[0]!.text()).toContain('minhthu');
    expect(rows[0]!.text()).toContain('Tiêu đề');
    expect(rows[0]!.text()).toContain('− Giới thiệu');
    expect(rows[0]!.text()).toContain('+ Giới thiệu QHHOJ');
    expect(rows[0]!.text()).toContain('− - Hơn **1 000** bài tập');
    expect(rows[1]!.text()).toContain('Tài khoản đã xoá');
    expect(rows[1]!.text()).not.toContain('/gioi-thieu');
  });

  it('opens another row’s diff on demand', async () => {
    mockApi(historyRoutes());
    const { wrapper } = await mountPages('/admin/pages?page=fp-1&tab=history');
    const second = wrapper.findAll('[data-testid="revision"]')[1]!;
    await second.get('button[aria-expanded="false"]').trigger('click');
    expect(second.text()).toContain('− /gioi-thieu');
    expect(second.text()).toContain('+ /about');
  });

  it('offers "Nạp giá trị cũ" only on an edit, and it fills the form without saving', async () => {
    const calls = mockApi(historyRoutes({ 'PATCH /admin/site/pages/fp-1': ok(flatpage()) }));
    const { wrapper } = await mountPages('/admin/pages?page=fp-1&tab=history');
    const buttons = wrapper
      .findAll('button')
      .filter((button) => button.text() === 'Nạp giá trị cũ');
    expect(buttons).toHaveLength(2);
    await buttons[0]!.trigger('click');
    await flushPromises();
    expect((wrapper.get('#page-title').element as HTMLInputElement).value).toBe('Giới thiệu');
    expect(wrapper.text()).toContain('Đã nạp giá trị cũ');
    expect(calls.some((call) => call.method === 'PATCH')).toBe(false);
    expect(wrapper.get('[data-testid="editor-tabs"] a[aria-current="page"]').text()).toContain(
      'Soạn',
    );
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
    await click(wrapper, 'Lưu trang');
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

  it('pages through the history 20 at a time', async () => {
    const calls = mockApi(
      historyRoutes({
        'GET /admin/site/pages/fp-1/revisions': (call: ApiCall) =>
          page(FLATPAGE_HISTORY, { page: Number(call.query.get('page')), pageSize: 20, total: 45 }),
      }),
    );
    const { wrapper } = await mountPages('/admin/pages?page=fp-1&tab=history');
    expect(wrapper.text()).toContain('45 bản');
    await click(wrapper, 'Sau');
    expect(
      calls
        .filter((call) => call.path.endsWith('/revisions'))
        .map((call) => call.query.get('page')),
    ).toEqual(['1', '2']);
  });

  it('has no history tab for a new page, and shows a failed history without blocking the editor', async () => {
    mockApi(historyRoutes({ 'GET /admin/site/pages/fp-1/revisions': fail(500, 'internal') }));
    const created = await mountPages('/admin/pages?page=new');
    expect(created.wrapper.find('a[href*="tab=history"]').exists()).toBe(false);
    const { wrapper } = await mountPages('/admin/pages?page=fp-1&tab=history');
    expect(wrapper.find('[data-testid="revision"]').exists()).toBe(false);
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    expect(wrapper.find('#page-title').exists()).toBe(true);
  });

  it('shows the new revision after a save', async () => {
    let revisions = FLATPAGE_HISTORY;
    const calls = mockApi(
      historyRoutes({
        'GET /admin/site/pages/fp-1/revisions': () => page(revisions, { pageSize: 20 }),
        'PATCH /admin/site/pages/fp-1': () => {
          revisions = [flatpageRevision({ id: 'rev-9' }), ...FLATPAGE_HISTORY];
          return ok(flatpage({ title: 'Mới' }));
        },
      }),
    );
    const { wrapper } = await mountPages('/admin/pages?page=fp-1');
    await wrapper.get('#page-title').setValue('Mới');
    await click(wrapper, 'Lưu trang');
    expect(calls.filter((call) => call.path.endsWith('/revisions')).length).toBeGreaterThan(1);
    expect(wrapper.get('a[href*="tab=history"]').text()).toContain('4');
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
    await click(wrapper, 'Lưu trang');
    expect(invalidatedKeys(queryClient, publicKey)).toEqual(publicKey);
    queryClient.setQueryData(['flatpages', '/about', 'probe'], { seeded: true });
    seedCache(queryClient, [['admin', 'flatpage-revisions', 'fp-1', 'probe']]);
    await click(wrapper, 'Xoá trang');
    await confirmDialog('Xoá trang');
    expect(invalidatedKeys(queryClient, publicKey)).toEqual(publicKey);
    expect(
      queryClient.getQueryState(['admin', 'flatpage-revisions', 'fp-1', 'probe']),
    ).toBeUndefined();
  });
});
