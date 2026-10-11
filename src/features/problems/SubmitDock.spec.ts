import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PHONE_QUERY } from '@/lib/use-media-query';
import { problemDetail, sessionUser } from '@/test/fixtures';
import { mockApi } from '@/test/mock-api';
import { commentPageRoute } from '@/test/community-routes';
import { stubMatchMedia } from '@/test/match-media';
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

/** The submit sheet replaces the dock on a phone. */
async function openOnPhone({ isPhone = true, path = '/problems/duongdi' } = {}) {
  const media = stubMatchMedia();
  media.setQuery(PHONE_QUERY, isPhone);
  const mounted = await mountApp(path);
  await vi.waitFor(() => expect(mounted.wrapper.find('#main h1').exists()).toBe(true));
  await flushPromises();
  return { ...mounted, media };
}
const collapsedBar = (wrapper: VueWrapper) => wrapper.get('section[aria-label="Nộp bài"]');
const sheetOf = (wrapper: VueWrapper) => wrapper.get('[role="dialog"]');
const expandButton = (wrapper: VueWrapper) => collapsedBar(wrapper).get('button[aria-expanded]');
async function expandSheet(wrapper: VueWrapper) {
  await expandButton(wrapper).trigger('click');
  await flushPromises();
}
describe('the sheet shell', () => {
  it('collapses on Escape and on the button, returning focus to the expand button', async () => {
    mockApi(signedInRoutes());
    const { wrapper } = await openOnPhone();
    await expandSheet(wrapper);
    await sheetOf(wrapper).get('textarea').trigger('keydown', { key: 'Escape' });
    await flushPromises();
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    expect(document.activeElement).toBe(expandButton(wrapper).element);
    await expandSheet(wrapper);
    await sheetOf(wrapper).get('button[aria-controls]').trigger('click');
    await flushPromises();
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });
  it('keeps the typed code when the screen is resized across the breakpoint', async () => {
    mockApi(signedInRoutes());
    const { wrapper, media } = await openOnPhone({ isPhone: false });
    await collapsedBar(wrapper).get('textarea').setValue('typed on desktop');
    media.setQuery(PHONE_QUERY, true);
    await flushPromises();
    await expandSheet(wrapper);
    expect(sheetOf(wrapper).get('textarea').element.value).toBe('typed on desktop');
  });
});
