import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { translate } from '@/i18n';
import { confirmDialog, staffViewer } from '@/test/admin-routes';
import { shortLink } from '@/test/f5-fixtures';
import { fail, invalid, issue, mockApi, noContent, page, sequence } from '@/test/mock-api';
import type { MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

const LINKS = [
  shortLink(),
  shortLink({
    code: 'hsg-2026',
    path: '/contests/hsg26',
    isAuto: false,
    hits: 42,
    expiresAt: '2099-12-31T00:00:00.000Z',
  }),
];
const routes = (extra: Record<string, MockHandler> = {}) => ({
  ...staffViewer(['judge.manage_short_link']),
  'GET /short-links': page(LINKS),
  ...extra,
});
const openPage = async () => {
  const mounted = await mountApp('/admin/short-links');
  await vi.waitFor(() =>
    expect(mounted.wrapper.find('[data-testid="short-links-table"]').exists()).toBe(true),
  );
  return mounted;
};
const rowOf = (wrapper: Awaited<ReturnType<typeof openPage>>['wrapper'], code: string) =>
  wrapper.get(`tr[data-code="${code}"]`);

describe('ShortLinksPage', () => {
  it('creates a link with a chosen code and expiry, then shows it with a copy button', async () => {
    const calls = mockApi(
      routes({
        'POST /short-links': {
          status: 201,
          body: { data: shortLink({ code: 'thi-thu', path: '/contests/r42', isAuto: false }) },
        },
      }),
    );
    const { wrapper } = await openPage();
    const form = wrapper.get('[data-testid="short-link-form"]');
    await form.get('#short-link-path').setValue('/contests/r42');
    await form.get('#short-link-code').setValue('thi-thu');
    await form.get('#short-link-expires').setValue('2099-12-31T23:30');
    await form.trigger('submit');
    await flushPromises();
    const body = calls.find((call) => call.method === 'POST')!.body as Record<string, string>;
    expect(body).toMatchObject({ path: '/contests/r42', code: 'thi-thu' });
    expect(new Date(body.expiresAt!).getTime()).toBe(new Date('2099-12-31T23:30').getTime());
    expect(wrapper.get('[data-testid="short-link-created"]').text()).toContain('Đã tạo /s/thi-thu');
    expect(
      calls.filter((call) => call.path === '/short-links' && call.method === 'GET'),
    ).toHaveLength(2);
  });

  it('puts a taken code (409) and a refused path (400) on their fields', async () => {
    mockApi(
      routes({
        'POST /short-links': sequence(
          fail(409, 'conflict'),
          invalid(issue('path', 'invalid', 'Only site pages can be shortened.')),
        ),
      }),
    );
    const { wrapper } = await openPage();
    const form = wrapper.get('[data-testid="short-link-form"]');
    await form.get('#short-link-path').setValue('/contests/r42');
    await form.get('#short-link-code').setValue('taken');
    await form.trigger('submit');
    await flushPromises();
    expect(form.get('#short-link-code').attributes('aria-invalid')).toBe('true');
    expect(form.text()).toContain('Mã này đã có người dùng.');
    await form.trigger('submit');
    await flushPromises();
    expect(form.get('#short-link-path').attributes('aria-invalid')).toBe('true');
    expect(form.text()).toContain(translate('admin.shortlinks.form.pathRefused'));
    expect(form.text()).not.toContain('Only site pages can be shortened.');
  });

  it('refuses an expiry in the past without sending anything', async () => {
    const calls = mockApi(routes());
    const { wrapper } = await openPage();
    const form = wrapper.get('[data-testid="short-link-form"]');
    await form.get('#short-link-path').setValue('/contests/r42');
    await form.get('#short-link-expires').setValue('2020-01-01T00:00');
    await form.trigger('submit');
    await flushPromises();
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
    expect(form.get('#short-link-expires').attributes('aria-invalid')).toBe('true');
    expect(form.text()).toContain('Thời điểm hết hạn phải sau hiện tại.');
  });

  it('deletes only after confirming, refreshes the list and drops the cached automatic links', async () => {
    mockApi(
      routes({
        'GET /short-links': sequence(page(LINKS), page([LINKS[0]])),
        'DELETE /short-links/hsg-2026': noContent(),
      }),
    );
    const { wrapper, queryClient } = await openPage();
    const autoKey = ['shortLinks', 'auto', 'u1', '/contests/hsg26'];
    queryClient.setQueryData(autoKey, LINKS[1]);
    await rowOf(wrapper, 'hsg-2026')
      .get('button[aria-label="Thao tác khác cho /s/hsg-2026"]')
      .trigger('click');
    await flushPromises();
    const deleteItem = [...document.body.querySelectorAll('[role="menuitem"]')].find((item) =>
      item.textContent?.includes('Xóa'),
    );
    (deleteItem!.querySelector('a') as HTMLElement).click();
    await flushPromises();
    expect(queryClient.getQueryData(autoKey)).toEqual(LINKS[1]);
    await confirmDialog('Xóa liên kết');
    await flushPromises();
    expect(wrapper.find('tr[data-code="hsg-2026"]').exists()).toBe(false);
    expect(queryClient.getQueryData(autoKey)).toBeUndefined();
  });
});
