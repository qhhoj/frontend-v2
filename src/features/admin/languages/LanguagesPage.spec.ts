import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { fail, mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { staffViewer } from '@/test/admin-routes';
import { LANGUAGES } from '@/test/admin-fixtures/languages';

/** The screen is a lazy route: the page is there once its chunk has loaded, and its list once the request has answered. */
const mountLanguages = async () => {
  const mounted = await mountApp('/admin/languages');
  await vi.waitFor(() => expect(mounted.wrapper.find('h1').exists()).toBe(true));
  await flushPromises();
  return mounted;
};

describe('LanguagesPage', () => {
  it('lists the languages without asking for the judges, and without a coverage column, for a holder of change_language alone', async () => {
    const calls = mockApi({
      ...staffViewer(['judge.change_language']),
      'GET /admin/languages': ok(LANGUAGES),
    });
    const { wrapper } = await mountLanguages();
    expect(wrapper.findAll('tbody tr')).toHaveLength(5);
    expect(calls.some((call) => call.path === '/judges')).toBe(false);
    expect(wrapper.text()).not.toContain('trực tuyến');
    expect(wrapper.text()).not.toContain('chỉ chạy trên một máy');
  });

  it('opens for a holder of add_language alone without asking for the list, and says it is add only', async () => {
    const calls = mockApi({
      ...staffViewer(['judge.add_language']),
      'GET /admin/languages': fail(403, 'forbidden'),
    });
    const { wrapper } = await mountLanguages();
    expect(calls.some((call) => call.path === '/admin/languages')).toBe(false);
    expect(wrapper.text()).toContain('chỉ được thêm ngôn ngữ mới');
    expect(wrapper.text()).not.toContain('Bạn không có quyền làm việc này.');
    expect(wrapper.text()).not.toContain('Chưa có ngôn ngữ nào.');
    expect(wrapper.get('a[href="/admin/languages/new"]').text()).toContain('Thêm ngôn ngữ');
  });
});
