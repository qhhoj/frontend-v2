import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { problemDetail, sessionUser, submissionDetail } from '@/test/fixtures';
import { mockApi, ok } from '@/test/mock-api';
import { commentPageRoute } from '@/test/community-routes';
import { stubMatchMedia } from '@/test/match-media';
import { mountApp } from '@/test/mount';
import { PROBLEM_LAYOUT } from './problem-layout';
import { FULLSCREEN_STORAGE_KEY } from './use-submit-fullscreen';
import { anonymousViewer, problemPageRoutes, signedInViewer } from '@/test/problem-routes';

vi.mock('@/components/code-editor-cm', () => {
  throw new Error('no editor in jsdom');
});

const dockOf = (wrapper: VueWrapper) => wrapper.get('section[aria-label="Nộp bài"]');
const railCard = (wrapper: VueWrapper) => wrapper.get('[data-testid="rail-submit"]');
/** P-02 B: the rail's one button opens the dock. */
async function openDock(wrapper: VueWrapper) {
  await railCard(wrapper).get('button').trigger('click');
  await flushPromises();
}
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
  it('sees one sign-in link that returns to this problem, and no dock or editor', async () => {
    mockApi({ ...anonymousViewer, ...problemPageRoutes() });
    const { wrapper } = await openProblem();
    const link = railCard(wrapper).get('a');
    expect(link.text()).toBe('Đăng nhập để nộp bài');
    expect(link.attributes('href')).toBe('/login?redirect=/problems/duongdi');
    expect(railCard(wrapper).find('button').exists()).toBe(false);
    expect(wrapper.find('section[aria-label="Nộp bài"]').exists()).toBe(false);
    expect(wrapper.find('textarea').exists()).toBe(false);
  });
});

describe('one way in (P-02 B)', () => {
  it('shows no dock on load; the rail button opens it, the close button removes it', async () => {
    mockApi(signedInRoutes());
    const { wrapper } = await openProblem();
    expect(wrapper.find('section[aria-label="Nộp bài"]').exists()).toBe(false);
    expect(railCard(wrapper).find('[data-pc-name="select"]').exists()).toBe(false);
    await openDock(wrapper);
    expect(dockOf(wrapper).find('textarea').exists()).toBe(true);
    await dockOf(wrapper).get('button[aria-label="Đóng khung nộp bài"]').trigger('click');
    await flushPromises();
    expect(wrapper.find('section[aria-label="Nộp bài"]').exists()).toBe(false);
  });

  it('opens the dock by itself for ?resubmit', async () => {
    mockApi({
      ...signedInRoutes(),
      'GET /submissions/sub-1': ok(submissionDetail()),
      'GET /submissions/sub-1/source': ok({ id: 'sub-1', source: 'print(42)\n' }),
    });
    const { wrapper } = await openProblem('/problems/duongdi?resubmit=sub-1');
    await vi.waitFor(() =>
      expect(dockOf(wrapper).get('textarea').element.value).toBe('print(42)\n'),
    );
  });
});

describe('after a submit (Q-01 B)', () => {
  it('stays on the problem and shows the result with a link to the full page', async () => {
    mockApi({
      ...signedInRoutes(),
      'POST /problems/duongdi/submit': ok({ id: 'sub-9' }),
      'GET /submissions/sub-9': ok(submissionDetail({ id: 'sub-9', points: 0 })),
    });
    const { wrapper, router } = await openProblem();
    await openDock(wrapper);
    await dockOf(wrapper).get('form').trigger('submit');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/problems/duongdi');
    const strip = dockOf(wrapper).get('[data-testid="submit-result"]');
    const shown = strip.get('p[aria-hidden="true"]');
    await vi.waitFor(() => expect(shown.text()).toBe('0 / 1600 · lỗi ở test 3'));
    // The ring shows the verdict; screen readers hear its name before the score.
    expect(strip.get('[role="status"]').text()).toMatch(/^\S.* · 0 \/ 1600 · lỗi ở test 3$/);
    expect(strip.get('[data-testid="submit-result-link"]').attributes('href')).toBe(
      '/submissions/sub-9',
    );
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
    await openDock(wrapper);
    await openLanguageList(wrapper);
    await pickLanguage('Python 3');
    await dockOf(wrapper).get('textarea').setValue('my python');
    await router.push('/problems/lis');
    await vi.waitFor(() => expect(wrapper.get('#main h1').text()).toBe('Dãy con tăng dài nhất'));
    await router.push('/problems/duongdi');
    await vi.waitFor(() => expect(wrapper.get('#main h1').text()).toBe('Đường đi ngắn nhất'));
    await flushPromises();
    await openDock(wrapper);
    expect(dockOf(wrapper).get('textarea').element.value).toContain('int main');
    expect(dockOf(wrapper).text()).toContain('C++17');
  });
});

/** Where the rail stacks under the statement (phones, tablets: below `lg` outside a contest), the sheet replaces the dock. */
const STACKED = PROBLEM_LAYOUT.plain.stacked;
async function openStacked({ isStacked = true, path = '/problems/duongdi' } = {}) {
  const media = stubMatchMedia();
  media.setQuery(STACKED, isStacked);
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
    const { wrapper } = await openStacked();
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
    const { wrapper, media } = await openStacked({ isStacked: false });
    await openDock(wrapper);
    await dockOf(wrapper).get('textarea').setValue('typed on desktop');
    media.setQuery(STACKED, true);
    await flushPromises();
    expect(sheetOf(wrapper).get('textarea').element.value).toBe('typed on desktop');
  });
  it('has no rail card where the rail stacks under the statement: the bar is the only way in', async () => {
    mockApi(signedInRoutes());
    const { wrapper } = await openStacked();
    expect(wrapper.find('[data-testid="rail-submit"]').exists()).toBe(false);
    expect(collapsedBar(wrapper).find('button[aria-expanded]').exists()).toBe(true);
  });
});

describe('full screen', () => {
  const fullscreenPanel = (wrapper: VueWrapper) =>
    wrapper.get('[role="dialog"][aria-modal="true"]');
  const enter = async (wrapper: VueWrapper) => {
    await dockOf(wrapper).get('button[aria-label="Toàn màn hình"]').trigger('click');
    await flushPromises();
  };
  beforeEach(() => localStorage.clear());

  it('keeps the typed code across docked and full screen, and leaves on Esc and on the button', async () => {
    mockApi(signedInRoutes());
    const { wrapper } = await openProblem();
    await openDock(wrapper);
    await dockOf(wrapper).get('textarea').setValue('typed docked');
    await enter(wrapper);
    expect(fullscreenPanel(wrapper).get('textarea').element.value).toBe('typed docked');
    expect(document.documentElement.style.overflow).toBe('hidden');
    expect(document.activeElement).toBe(fullscreenPanel(wrapper).element);

    await fullscreenPanel(wrapper).get('textarea').setValue('typed full');
    await fullscreenPanel(wrapper).trigger('keydown', { key: 'Escape' });
    await flushPromises();
    expect(wrapper.find('[aria-modal="true"]').exists()).toBe(false);
    expect(document.documentElement.style.overflow).toBe('');
    expect(dockOf(wrapper).get('textarea').element.value).toBe('typed full');
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Toàn màn hình');

    await enter(wrapper);
    await fullscreenPanel(wrapper).get('button[aria-label="Thu nhỏ"]').trigger('click');
    await flushPromises();
    expect(wrapper.find('[aria-modal="true"]').exists()).toBe(false);
  });

  it('remembers the choice in this browser for the next opening, defaulting to docked', async () => {
    mockApi(signedInRoutes());
    const first = await openProblem();
    await openDock(first.wrapper);
    expect(first.wrapper.find('[aria-modal="true"]').exists()).toBe(false);
    await enter(first.wrapper);
    expect(localStorage.getItem(FULLSCREEN_STORAGE_KEY)).toBe('1');
    first.wrapper.unmount();
    const second = await openProblem();
    expect(second.wrapper.find('[aria-modal="true"]').exists()).toBe(false);
    await openDock(second.wrapper);
    expect(second.wrapper.find('[aria-modal="true"]').exists()).toBe(true);
    expect(document.documentElement.style.overflow).toBe('hidden');
  });

  it('ignores Esc that closes an open dropdown inside the panel', async () => {
    mockApi(signedInRoutes());
    const { wrapper } = await openProblem();
    await openDock(wrapper);
    await enter(wrapper);
    const select = fullscreenPanel(wrapper).get('[data-pc-name="select"]');
    select.element.setAttribute('aria-expanded', 'true');
    await select.trigger('keydown', { key: 'Escape' });
    expect(wrapper.find('[aria-modal="true"]').exists()).toBe(true);
  });
});
