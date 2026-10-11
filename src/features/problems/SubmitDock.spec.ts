import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { problemDetail, sessionUser } from '@/test/fixtures';
import { mockApi } from '@/test/mock-api';
import { commentPageRoute } from '@/test/community-routes';
import { mountApp } from '@/test/mount';
import { anonymousViewer, problemPageRoutes, signedInViewer } from '@/test/problem-routes';

vi.mock('@/components/code-editor-cm', () => {
  throw new Error('no editor in jsdom');
});

const dockOf = (wrapper: VueWrapper) => wrapper.get('section[aria-label="Nộp bài"]');
const openProblem = async (path = '/problems/duongdi') => {
  const mounted = await mountApp(path);
  await vi.waitFor(() => expect(mounted.wrapper.find('#main h1').exists()).toBe(true));
  await flushPromises();
  return mounted;
};
const signedInRoutes = (detail = problemDetail()) => ({
  ...signedInViewer(),
  ...problemPageRoutes(detail),
});
const openLanguageList = async (wrapper: VueWrapper) => {
  await dockOf(wrapper).get('[data-pc-name="select"]').trigger('click');
  await flushPromises();
};
const pickLanguage = async (name: string) => {
  const options = [...document.body.querySelectorAll<HTMLElement>('[role="option"]')];
  const target = options.find((option) => option.textContent?.includes(name))!;
  target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); // PrimeVue selects on mousedown
  await flushPromises();
};

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

describe('anonymous viewer', () => {
  it('sees one sign-in row that returns to this problem, and no editor', async () => {
    mockApi({ ...anonymousViewer, ...problemPageRoutes() });
    const { wrapper } = await openProblem();
    const dock = dockOf(wrapper);
    const link = dock.get('a');
    expect(link.text()).toBe('Đăng nhập để nộp bài');
    expect(link.attributes('href')).toBe('/login?redirect=/problems/duongdi');
    expect(dock.find('textarea').exists()).toBe(false);
    expect(dock.find('button').exists()).toBe(false);
  });
});

describe('?resubmit', () => {
  it('is ignored for an anonymous viewer, who must not trigger a 401 fetch', async () => {
    const calls = mockApi({ ...anonymousViewer, ...problemPageRoutes() });
    await openProblem('/problems/duongdi?resubmit=sub-1');
    expect(calls.filter((call) => call.path.startsWith('/submissions'))).toHaveLength(0);
  });
});

describe('another problem', () => {
  it('starts fresh when the viewer leaves a problem and comes back to it', async () => {
    mockApi({ ...signedInRoutes(), ...commentPageRoute('problem', 'lis') });
    const { wrapper, router, queryClient } = await openProblem();
    // A cached detail shows at once, so the page (and the dock) is not torn down by a loading state.
    queryClient.setQueryData(
      ['problems', 'detail', sessionUser().id, 'lis', 'vi'],
      problemDetail({ code: 'lis', name: 'Dãy con tăng dài nhất' }),
    );
    await openLanguageList(wrapper);
    await pickLanguage('Python 3');
    await dockOf(wrapper).get('textarea').setValue('my python');
    await router.push('/problems/lis');
    await vi.waitFor(() => expect(wrapper.get('#main h1').text()).toBe('Dãy con tăng dài nhất'));
    await router.push('/problems/duongdi');
    await vi.waitFor(() => expect(wrapper.get('#main h1').text()).toBe('Đường đi ngắn nhất'));
    await flushPromises();
    expect(dockOf(wrapper).get('textarea').element.value).toContain('int main');
    expect(dockOf(wrapper).text()).toContain('C++17');
  });
});

describe('--dock-height', () => {
  it('follows the dock size and is removed with the dock', async () => {
    let notify: ((entries: unknown[]) => void) | undefined;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: (entries: unknown[]) => void) {
          notify = callback;
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    mockApi(signedInRoutes());
    const { wrapper } = await openProblem();
    notify!([{ contentRect: { height: 120 } }]);
    expect(document.documentElement.style.getPropertyValue('--dock-height')).toBe('120px');
    wrapper.unmount();
    expect(document.documentElement.style.getPropertyValue('--dock-height')).toBe('');
  });
});
