import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { fail, mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { staffViewer } from '@/test/admin-routes';
import { JUDGE_FLEET } from '@/test/admin-fixtures/judges';
import { LANGUAGES } from '@/test/admin-fixtures/languages';

/** The screen is a lazy route: the page is there once its chunk has loaded, and its list once the request has answered. */
const mountLanguages = async () => {
  const mounted = await mountApp('/admin/languages');
  await vi.waitFor(() => expect(mounted.wrapper.find('h1').exists()).toBe(true));
  await flushPromises();
  return mounted;
};

describe('LanguagesPage', () => {
  it('lists the languages with judge coverage and the single-judge warning for a holder of both permissions', async () => {
    mockApi({
      ...staffViewer(['judge.change_language', 'judge.change_judge']),
      'GET /admin/languages': ok(LANGUAGES),
      'GET /judges': ok(JUDGE_FLEET),
    });
    const { wrapper } = await mountLanguages();
    expect(wrapper.text()).toContain('5 ngôn ngữ');
    const cpp20 = wrapper.findAll('tbody tr').find((row) => row.text().includes('CPP20'))!;
    expect(cpp20.text()).toContain('5 / 5');
    expect(wrapper.text()).toContain('PAS chỉ chạy trên một máy');
  });

  it('lists the languages without asking for the judges, and without a coverage column, for a holder of change_language alone', async () => {
    const calls = mockApi({
      ...staffViewer(['judge.change_language']),
      'GET /admin/languages': ok(LANGUAGES),
    });
    const { wrapper } = await mountLanguages();
    expect(wrapper.findAll('tbody tr')).toHaveLength(5);
    expect(calls.some((call) => call.path === '/judges')).toBe(false);
    expect(wrapper.text()).not.toContain('Máy chấm hỗ trợ');
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

  it('offers "Thêm ngôn ngữ" only with add_language, and links each key to its edit page', async () => {
    mockApi({
      ...staffViewer(['judge.change_language', 'judge.add_language']),
      'GET /admin/languages': ok(LANGUAGES),
    });
    const both = await mountLanguages();
    expect(both.wrapper.get('a[href="/admin/languages/new"]').text()).toContain('Thêm ngôn ngữ');
    expect(both.wrapper.get('a[href="/admin/languages/CPP20"]').text()).toBe('CPP20');
    mockApi({ ...staffViewer(['judge.change_language']), 'GET /admin/languages': ok(LANGUAGES) });
    const changeOnly = await mountLanguages();
    expect(changeOnly.wrapper.find('a[href="/admin/languages/new"]').exists()).toBe(false);
  });
});
