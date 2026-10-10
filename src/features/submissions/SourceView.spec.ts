import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { anonymousViewer } from '@/test/problem-routes';
import { mockApi, ok } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import SourceView from './SourceView.vue';

const props = (languageKey: string | null) => ({
  id: 'sub-1',
  problemCode: 'aplusb',
  isOwn: false,
  languageKey,
});

describe('SourceView highlighting', () => {
  it('colours the source for its language and follows a language change, text unchanged', async () => {
    const source = 'return 1;';
    mockApi({ ...anonymousViewer, 'GET /submissions/sub-1/source': ok({ id: 'sub-1', source }) });
    const view = mountComponent(SourceView, { props: props('CPP17') });
    await flushPromises();
    await vi.waitFor(() => expect(view.find('pre.pr-6 .syn-keyword').exists()).toBe(true));
    await view.setProps(props('PAS'));
    await flushPromises();
    expect(view.find('pre.pr-6 span').exists()).toBe(false);
    expect(view.get('pre.pr-6').text()).toBe(source);
    await view.setProps(props('PY3'));
    await vi.waitFor(() => expect(view.find('pre.pr-6 .syn-keyword').exists()).toBe(true));
    expect(view.get('pre.pr-6').text()).toBe(source);
  });
});
