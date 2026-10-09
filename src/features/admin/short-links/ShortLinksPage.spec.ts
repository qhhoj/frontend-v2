import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { translate } from '@/i18n';
import { confirmDialog, staffViewer } from '@/test/admin-routes';
import { shortLink } from '@/test/f5-fixtures';
import {
  fail,
  hangRequestsExcept,
  invalid,
  issue,
  mockApi,
  noContent,
  page,
  sequence,
} from '@/test/mock-api';
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
  it('lists every link (scope=all) with kind, visits and expiry', async () => {
    const calls = mockApi(routes());
    const { wrapper } = await openPage();
    expect(calls.find((call) => call.path === '/short-links')!.query.get('scope')).toBe('all');
    expect(rowOf(wrapper, 'hsg-2026').text()).toContain('Chọn tay');
    expect(rowOf(wrapper, 'hsg-2026').text()).toContain('42');
    expect(rowOf(wrapper, 'k7m2xq').text()).toContain('Tự động');
    expect(rowOf(wrapper, 'k7m2xq').text()).toContain('Không');
  });

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
    await form.get('#short-link-expires').setValue('2026-12-31T23:30');
    await form.trigger('submit');
    await flushPromises();
    const body = calls.find((call) => call.method === 'POST')!.body as Record<string, string>;
    expect(body).toMatchObject({ path: '/contests/r42', code: 'thi-thu' });
    expect(new Date(body.expiresAt!).getTime()).toBe(new Date('2026-12-31T23:30').getTime());
    expect(wrapper.get('[data-testid="short-link-created"]').text()).toContain('Đã tạo /s/thi-thu');
    expect(
      calls.filter((call) => call.path === '/short-links' && call.method === 'GET'),
    ).toHaveLength(2);
  });

  it('sends no code or expiry when they are left empty', async () => {
    const calls = mockApi(
      routes({ 'POST /short-links': { status: 201, body: { data: shortLink() } } }),
    );
    const { wrapper } = await openPage();
    const form = wrapper.get('[data-testid="short-link-form"]');
    await form.get('#short-link-path').setValue(' /problems/aplusb ');
    await form.trigger('submit');
    await flushPromises();
    expect(calls.find((call) => call.method === 'POST')!.body).toEqual({
      path: '/problems/aplusb',
    });
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

  it('deletes only after confirming, then refreshes the list', async () => {
    const calls = mockApi(
      routes({
        'GET /short-links': sequence(page(LINKS), page([LINKS[0]])),
        'DELETE /short-links/hsg-2026': noContent(),
      }),
    );
    const { wrapper } = await openPage();
    await rowOf(wrapper, 'hsg-2026')
      .get('button[aria-label="Xóa liên kết hsg-2026"]')
      .trigger('click');
    await flushPromises();
    expect(calls.some((call) => call.method === 'DELETE')).toBe(false);
    await confirmDialog('Xóa liên kết');
    await flushPromises();
    expect(
      calls.some((call) => call.method === 'DELETE' && call.path === '/short-links/hsg-2026'),
    ).toBe(true);
    expect(wrapper.find('tr[data-code="hsg-2026"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('Đã xóa /s/hsg-2026');
  });

  it('shows the empty state with Bit', async () => {
    mockApi(routes({ 'GET /short-links': page([]) }));
    const { wrapper } = await mountApp('/admin/short-links');
    await flushPromises();
    expect(wrapper.text()).toContain('Chưa có liên kết ngắn nào.');
    expect(wrapper.find('[data-testid="admin-bit"][data-placement="empty"]').exists()).toBe(true);
  });

  it('shows skeleton rows while the list loads', async () => {
    mockApi(routes());
    hangRequestsExcept(['/auth/me', '/profile']);
    const { wrapper } = await mountApp('/admin/short-links');
    await flushPromises();
    expect(wrapper.findAll('[data-skeleton-region="short-link-row"]').length).toBeGreaterThan(2);
  });
});
