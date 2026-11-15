import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CPP17_ID, problemDetail, sessionUser, submissionDetail } from '@/test/fixtures';
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

const paneOf = (wrapper: VueWrapper) => wrapper.get('[data-testid="submit-pane"]');
const openButton = (wrapper: VueWrapper) => wrapper.find('[data-testid="submit-open"]');
/** The page loads with the pane closed; `openPane` false keeps it so. */
const openProblem = async (path = '/problems/duongdi', { openPane = true } = {}) => {
  const mounted = await mountApp(path);
  await vi.waitFor(() => expect(mounted.wrapper.find('#main h1').exists()).toBe(true));
  await flushPromises();
  if (openPane && openButton(mounted.wrapper).exists()) {
    await openButton(mounted.wrapper).trigger('click');
    await flushPromises();
  }
  return mounted;
};
const signedInRoutes = (detail = problemDetail()) => ({
  ...signedInViewer(),
  ...problemPageRoutes(detail),
});
const pickerOf = (wrapper: VueWrapper) => paneOf(wrapper).get('[role="combobox"]');
const openLanguageList = async (wrapper: VueWrapper) => {
  await pickerOf(wrapper).trigger('click');
  await flushPromises();
};
/** Mouse down and click: the PrimeVue list picks on the first, the native one on the second. */
const pickLanguage = async (name: string) => {
  const options = [...document.body.querySelectorAll<HTMLElement>('[role="option"]')];
  const target = options.find((option) => option.textContent?.includes(name))!;
  target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
  target.click();
  await flushPromises();
};

beforeEach(() => {
  localStorage.clear(); // a language picked in one test is remembered for the next
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

describe('anonymous viewer', () => {
  it('sees one sign-in link that returns to this problem, and no editor', async () => {
    mockApi({ ...anonymousViewer, ...problemPageRoutes() });
    const { wrapper } = await openProblem();
    const link = wrapper.get('[data-testid="submit-sign-in"] a');
    expect(link.text()).toBe('Đăng nhập để nộp bài');
    expect(link.attributes('href')).toBe('/login?redirect=/problems/duongdi');
    expect(wrapper.find('[data-testid="submit-pane"]').exists()).toBe(false);
    expect(wrapper.find('textarea').exists()).toBe(false);
  });
});

describe('the pane beside the statement', () => {
  it('is closed on load, opens from the header, and keeps the typed code when closed', async () => {
    mockApi(signedInRoutes());
    const { wrapper } = await openProblem('/problems/duongdi', { openPane: false });
    expect(wrapper.find('[data-testid="submit-pane"]').exists()).toBe(false);
    await openButton(wrapper).trigger('click');
    await flushPromises();
    await paneOf(wrapper).get('textarea').setValue('kept code');
    await paneOf(wrapper).get('[data-testid="submit-close"]').trigger('click');
    await flushPromises();
    expect(wrapper.find('[data-testid="submit-pane"]').exists()).toBe(false);
    expect(document.activeElement).toBe(openButton(wrapper).element);
    await openButton(wrapper).trigger('click');
    await flushPromises();
    expect(paneOf(wrapper).get('textarea').element.value).toBe('kept code');
  });
  it('opens on load with the editor, filled for ?resubmit', async () => {
    mockApi({
      ...signedInRoutes(),
      'GET /submissions/sub-1': ok(submissionDetail()),
      'GET /submissions/sub-1/source': ok({ id: 'sub-1', source: 'print(42)\n' }),
    });
    const { wrapper } = await openProblem('/problems/duongdi?resubmit=sub-1');
    expect(paneOf(wrapper).find('textarea').exists()).toBe(true);
    await vi.waitFor(() =>
      expect(paneOf(wrapper).get('textarea').element.value).toBe('print(42)\n'),
    );
  });
});

describe('after a submit', () => {
  it('stays on the problem and shows the result with a link to the full page', async () => {
    mockApi({
      ...signedInRoutes(),
      'POST /problems/duongdi/submit': ok({ id: 'sub-9' }),
      'GET /submissions/sub-9': ok(submissionDetail({ id: 'sub-9', points: 0 })),
    });
    const { wrapper, router } = await openProblem();
    await paneOf(wrapper).get('form').trigger('submit');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/problems/duongdi');
    const strip = paneOf(wrapper).get('[data-testid="submit-result"]');
    const shown = strip.get('p[aria-hidden="true"]');
    await vi.waitFor(() =>
      expect(shown.findAll('span').map((part) => part.text())).toEqual([
        '0 / 1600',
        'lỗi ở test 3',
      ]),
    );
    // The ring shows the verdict; screen readers hear its name before the score.
    expect(strip.get('[role="status"]').text()).toMatch(/^\S.* · 0 \/ 1600 · lỗi ở test 3$/);
    expect(strip.get('[data-testid="submit-result-link"]').attributes('href')).toBe(
      '/submissions/sub-9',
    );
  });
});

/** P0: what is sent is exactly the code and the language the viewer sees, whatever the language list is doing. */
describe('Ctrl Enter and the language list', () => {
  const submitRoutes = () => ({
    ...signedInRoutes(),
    'POST /problems/duongdi/submit': ok({ id: 'sub-9' }),
    'GET /submissions/sub-9': ok(submissionDetail({ id: 'sub-9' })),
  });
  const ctrlEnter = { key: 'Enter', ctrlKey: true };
  const posts = (calls: ReturnType<typeof mockApi>) =>
    calls.filter((call) => call.method === 'POST');

  it('in the open list sends nothing, and the next submit posts the language the box then shows', async () => {
    const calls = mockApi(submitRoutes());
    const { wrapper } = await openProblem();
    await openLanguageList(wrapper);
    await pickerOf(wrapper).trigger('keydown', { key: 'ArrowDown' });
    await pickerOf(wrapper).trigger('keydown', ctrlEnter);
    await flushPromises();
    expect(posts(calls)).toHaveLength(0);
    await pickerOf(wrapper).trigger('keydown', { key: 'Escape' });
    const shown = pickerOf(wrapper).text();
    await paneOf(wrapper).get('form').trigger('submit');
    await flushPromises();
    const [post] = posts(calls);
    const sent = problemDetail().allowedLanguages.find(
      (language) => language.id === (post!.body as { language: string }).language,
    );
    expect(shown).toContain(sent!.name);
    expect((post!.body as { source: string }).source).toBe(
      paneOf(wrapper).get('textarea').element.value,
    );
  });

  it('in the editor while the list is open sends the language in the box, not the one under the arrow', async () => {
    const calls = mockApi(submitRoutes());
    const { wrapper } = await openProblem();
    await paneOf(wrapper).get('textarea').setValue('int main() { return 0; }\n');
    await openLanguageList(wrapper);
    await pickerOf(wrapper).trigger('keydown', { key: 'ArrowDown' });
    expect(pickerOf(wrapper).text()).toContain('C++17');
    await paneOf(wrapper).get('textarea').trigger('keydown', ctrlEnter);
    await flushPromises();
    expect(posts(calls).map((call) => call.body)).toEqual([
      { language: CPP17_ID, source: 'int main() { return 0; }\n' },
    ]);
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
    // A cached detail shows at once, so the page (and the pane) is not torn down by a loading state.
    queryClient.setQueryData(
      ['problems', 'detail', sessionUser().id, 'lis', 'vi'],
      problemDetail({ code: 'lis', name: 'Dãy con tăng dài nhất' }),
    );
    await openLanguageList(wrapper);
    await pickLanguage('Python 3');
    await paneOf(wrapper).get('textarea').setValue('my python');
    await router.push('/problems/lis');
    await vi.waitFor(() => expect(wrapper.get('#main h1').text()).toBe('Dãy con tăng dài nhất'));
    await router.push('/problems/duongdi');
    await vi.waitFor(() => expect(wrapper.get('#main h1').text()).toBe('Đường đi ngắn nhất'));
    await flushPromises();
    await openButton(wrapper).trigger('click');
    await flushPromises();
    // The code starts fresh; the language is the one the viewer picked last, remembered in this browser.
    expect(paneOf(wrapper).get('textarea').element.value).toBe('print()\n');
    expect(pickerOf(wrapper).text()).toContain('Python 3');
  });
});

/** Where the statement takes the whole column (phones, tablets: below `lg` outside a contest), the sheet replaces the pane. */
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
describe('the sheet', () => {
  it('collapses on Escape and on the button, returning focus to the expand button', async () => {
    mockApi(signedInRoutes());
    const { wrapper } = await openStacked();
    expect(wrapper.find('[data-testid="submit-pane"]').exists()).toBe(false);
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
    await openButton(wrapper).trigger('click');
    await flushPromises();
    await paneOf(wrapper).get('textarea').setValue('typed on desktop');
    media.setQuery(STACKED, true);
    await flushPromises();
    expect(sheetOf(wrapper).get('textarea').element.value).toBe('typed on desktop');
  });
  it('shows the last result on the collapsed bar', async () => {
    mockApi({
      ...signedInRoutes(),
      'POST /problems/duongdi/submit': ok({ id: 'sub-9' }),
      'GET /submissions/sub-9': ok(submissionDetail({ id: 'sub-9', points: 0 })),
    });
    const { wrapper } = await openStacked();
    await expandSheet(wrapper);
    await sheetOf(wrapper).get('form').trigger('submit');
    await flushPromises();
    await sheetOf(wrapper).get('button[aria-controls]').trigger('click');
    await flushPromises();
    await vi.waitFor(() =>
      expect(collapsedBar(wrapper).get('[data-testid="sheet-result"]').text()).toBe(
        '0 / 1600 · lỗi ở test 3',
      ),
    );
  });
});

describe('full screen', () => {
  const fullscreenPanel = (wrapper: VueWrapper) =>
    wrapper.get('[role="dialog"][aria-modal="true"]');
  const enter = async (wrapper: VueWrapper) => {
    await paneOf(wrapper).get('button[aria-label="Toàn màn hình"]').trigger('click');
    await flushPromises();
  };

  it('keeps the typed code across the pane and full screen, and leaves on Esc and on the button', async () => {
    mockApi(signedInRoutes());
    const { wrapper } = await openProblem();
    await paneOf(wrapper).get('textarea').setValue('typed in the pane');
    await enter(wrapper);
    expect(fullscreenPanel(wrapper).get('textarea').element.value).toBe('typed in the pane');
    expect(document.documentElement.style.overflow).toBe('hidden');
    expect(document.activeElement).toBe(fullscreenPanel(wrapper).element);

    await fullscreenPanel(wrapper).get('textarea').setValue('typed full');
    await fullscreenPanel(wrapper).trigger('keydown', { key: 'Escape' });
    await flushPromises();
    expect(wrapper.find('[aria-modal="true"]').exists()).toBe(false);
    expect(document.documentElement.style.overflow).toBe('');
    expect(paneOf(wrapper).get('textarea').element.value).toBe('typed full');
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Toàn màn hình');

    await enter(wrapper);
    await fullscreenPanel(wrapper).get('button[aria-label="Thu nhỏ"]').trigger('click');
    await flushPromises();
    expect(wrapper.find('[aria-modal="true"]').exists()).toBe(false);
  });

  it("remembers the choice for the sheet's next opening, never for the pane", async () => {
    localStorage.setItem(FULLSCREEN_STORAGE_KEY, '1');
    mockApi(signedInRoutes());
    const desktop = await openProblem();
    expect(paneOf(desktop.wrapper).exists()).toBe(true);
    expect(desktop.wrapper.find('[aria-modal="true"]').exists()).toBe(false);
    desktop.wrapper.unmount();
    const phone = await openStacked();
    expect(phone.wrapper.find('[aria-modal="true"]').exists()).toBe(false);
    await expandSheet(phone.wrapper);
    expect(phone.wrapper.find('[aria-modal="true"]').exists()).toBe(true);
  });

  it('ignores Esc that closes an open dropdown inside the panel', async () => {
    mockApi(signedInRoutes());
    const { wrapper } = await openProblem();
    await enter(wrapper);
    const select = fullscreenPanel(wrapper).get('[role="combobox"]');
    await select.trigger('click');
    await flushPromises();
    await select.trigger('keydown', { key: 'Escape' });
    expect(wrapper.find('[aria-modal="true"]').exists()).toBe(true);
  });
});
