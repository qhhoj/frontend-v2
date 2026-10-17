import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import type { SourceAccess } from '@/api/types/submissions';
import { anonymousViewer } from '@/test/problem-routes';
import { fail, mockApi, ok } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import SourceView from './SourceView.vue';

const props = (languageKey: string | null, access: SourceAccess = 'granted') => ({
  id: 'sub-1',
  access,
  languageKey,
  languageName: null,
});
const sourceCalls = (calls: { path: string }[]) =>
  calls.filter((call) => call.path.startsWith('/submissions/sub-1/source'));

describe('SourceView highlighting', () => {
  it('colours the source for its language and follows a language change, text unchanged', async () => {
    const source = 'return 1;';
    mockApi({ ...anonymousViewer, 'GET /submissions/sub-1/source': ok({ id: 'sub-1', source }) });
    const view = mountComponent(SourceView, { props: props('CPP17') });
    await vi.waitFor(() => expect(view.find('[data-testid="source-expand"]').exists()).toBe(true));
    await view.get('[data-testid="source-expand"]').trigger('click');
    await flushPromises();
    await vi.waitFor(() => expect(view.find('pre.pr-6 .syn-keyword').exists()).toBe(true));
    await view.setProps(props('PAS') as never);
    await flushPromises();
    expect(view.find('pre.pr-6 span').exists()).toBe(false);
    expect(view.get('pre.pr-6').text()).toBe(source);
    await view.setProps(props('PY3') as never);
    await vi.waitFor(() => expect(view.find('pre.pr-6 .syn-keyword').exists()).toBe(true));
    expect(view.get('pre.pr-6').text()).toBe(source);
  });
});

describe('SourceView access', () => {
  it('never asks a visitor for the source and offers sign-in back to this page', async () => {
    const calls = mockApi({ ...anonymousViewer });
    const view = mountComponent(SourceView, { props: props('CPP17', 'sign_in') });
    await flushPromises();
    expect(sourceCalls(calls)).toEqual([]);
    const locked = view.get('[data-testid="source-locked"]');
    expect(locked.text()).toContain('Đăng nhập để xem mã nguồn');
    expect(locked.get('a').attributes('href')).toMatch(/^\/login\?redirect=/);
  });

  it.each([
    ['solve_first', 'Giải bài này để xem mã nguồn.'],
    ['hidden', 'Bạn không xem được mã nguồn của bài nộp này.'],
  ] as const)('says why for %s, without a request or a sign-in button', async (access, text) => {
    const calls = mockApi({ ...anonymousViewer });
    const view = mountComponent(SourceView, { props: props('CPP17', access) });
    await flushPromises();
    expect(sourceCalls(calls)).toEqual([]);
    expect(view.get('[data-testid="source-locked"]').text()).toBe(text);
    expect(view.find('[data-testid="source-locked"] a').exists()).toBe(false);
  });

  it('turns a 401 from the source endpoint (signed out meanwhile) into the sign-in notice', async () => {
    mockApi({
      ...anonymousViewer,
      'GET /submissions/sub-1/source': fail(401, 'unauthorized'),
    });
    const view = mountComponent(SourceView, { props: props('CPP17') });
    await vi.waitFor(() =>
      expect(view.find('[data-testid="source-locked"] a').exists()).toBe(true),
    );
  });
});
