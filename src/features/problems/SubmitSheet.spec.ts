import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PHONE_QUERY } from '@/lib/use-media-query';
import { SCRATCH_ID, problemDetail } from '@/test/fixtures';
import { fail, mockApi, ok } from '@/test/mock-api';
import { stubMatchMedia } from '@/test/match-media';
import { mountApp } from '@/test/mount';
import { anonymousViewer, problemPageRoutes, signedInViewer } from '@/test/problem-routes';

vi.mock('@/components/code-editor-cm', () => {
  throw new Error('no editor in jsdom');
});

const signedInRoutes = (detail = problemDetail()) => ({
  ...signedInViewer(),
  ...problemPageRoutes(detail),
});
async function openProblem({ isPhone = true } = {}) {
  const media = stubMatchMedia();
  media.setQuery(PHONE_QUERY, isPhone);
  const mounted = await mountApp('/problems/duongdi');
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
async function pickLanguage(wrapper: VueWrapper, name: string) {
  await sheetOf(wrapper).get('[data-pc-name="select"]').trigger('click');
  await flushPromises();
  const options = [...document.body.querySelectorAll<HTMLElement>('[role="option"]')];
  options
    .find((option) => option.textContent?.includes(name))!
    .dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); // PrimeVue selects on mousedown
  await flushPromises();
}
const chooseFile = async (wrapper: VueWrapper, file: File) => {
  const input = sheetOf(wrapper).get('input[accept]');
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true });
  await input.trigger('change');
};

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

describe('the sheet shell', () => {
  it('starts as a collapsed bar without an editor', async () => {
    mockApi(signedInRoutes());
    const { wrapper } = await openProblem();
    expect(expandButton(wrapper).attributes('aria-expanded')).toBe('false');
    expect(expandButton(wrapper).classes()).toContain('size-11');
    expect(collapsedBar(wrapper).get('h2').text()).toBe('Nộp bài');
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    expect(wrapper.find('textarea').exists()).toBe(false);
  });
  it('opens a dialog with the title focused, the same editor and counter, and big touch targets', async () => {
    mockApi(signedInRoutes());
    const { wrapper } = await openProblem();
    await expandSheet(wrapper);
    const sheet = sheetOf(wrapper);
    expect(sheet.attributes('aria-label')).toBe('Nộp bài');
    expect(sheet.attributes('aria-modal')).toBe('false');
    expect(document.activeElement).toBe(sheet.get('h2').element);
    const collapse = sheet.get('button[aria-controls]');
    expect(collapse.attributes('aria-expanded')).toBe('true');
    expect(collapse.classes()).toContain('size-11');
    expect(sheet.get('button[type="submit"]').classes()).toContain('h-14');
    expect(sheet.find('textarea').exists()).toBe(true);
    expect(sheet.get('[data-testid="source-counter"]').text()).toMatch(/^\d+ \/ 65\.536$/);
  });
  it('collapses on Escape and on the button, returning focus to the expand button', async () => {
    mockApi(signedInRoutes());
    const { wrapper } = await openProblem();
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
  it('keeps the typed code through a collapse', async () => {
    mockApi(signedInRoutes());
    const { wrapper } = await openProblem();
    await expandSheet(wrapper);
    await sheetOf(wrapper).get('textarea').setValue('my code');
    await sheetOf(wrapper).trigger('keydown', { key: 'Escape' });
    await expandSheet(wrapper);
    expect(sheetOf(wrapper).get('textarea').element.value).toBe('my code');
  });
  it('is a single sign-in bar for an anonymous viewer', async () => {
    mockApi({ ...anonymousViewer, ...problemPageRoutes() });
    const { wrapper } = await openProblem();
    const bar = collapsedBar(wrapper);
    expect(bar.get('a').attributes('href')).toBe('/login?redirect=/problems/duongdi');
    expect(bar.find('button').exists()).toBe(false);
    expect(wrapper.find('textarea').exists()).toBe(false);
  });
  it('gives a wider screen the pinned dock and no dialog', async () => {
    mockApi(signedInRoutes());
    const { wrapper } = await openProblem({ isPhone: false });
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    expect(collapsedBar(wrapper).find('textarea').exists()).toBe(true);
  });
  it('keeps the typed code when the screen is resized across the breakpoint', async () => {
    mockApi(signedInRoutes());
    const { wrapper, media } = await openProblem({ isPhone: false });
    await collapsedBar(wrapper).get('textarea').setValue('typed on desktop');
    media.setQuery(PHONE_QUERY, true);
    await flushPromises();
    await expandSheet(wrapper);
    expect(sheetOf(wrapper).get('textarea').element.value).toBe('typed on desktop');
  });
});

describe('the sheet with a file-only language', () => {
  async function openScratch() {
    mockApi(signedInRoutes());
    const mounted = await openProblem();
    await expandSheet(mounted.wrapper);
    await sheetOf(mounted.wrapper).get('textarea').setValue('my cpp');
    await pickLanguage(mounted.wrapper, 'Scratch 3');
    return mounted;
  }
  it('shows the tag, the dropzone and no editor', async () => {
    const { wrapper } = await openScratch();
    const sheet = sheetOf(wrapper);
    expect(sheet.get('[data-pc-name="select"]').text()).toContain('tải tệp');
    expect(sheet.get('input[accept]').attributes('accept')).toBe('.sb3');
    expect(sheet.text()).toContain('Tối đa 5.0 MB');
    expect(sheet.find('textarea').exists()).toBe(false);
    expect(sheet.get('button[type="submit"]').text()).toBe('Nộp tệp');
  });
  it('refuses a wrong extension and shows the card for a right one', async () => {
    const { wrapper } = await openScratch();
    await chooseFile(wrapper, new File(['x'], 'cat.zip'));
    expect(sheetOf(wrapper).get('[role="alert"]').text()).toBe('Tệp phải có đuôi .sb3.');
    expect(sheetOf(wrapper).find('[title="cat.zip"]').exists()).toBe(false);
    await chooseFile(wrapper, new File(['x'.repeat(2048)], 'catmaze-final.sb3'));
    expect(sheetOf(wrapper).get('[title="catmaze-final.sb3"]').text()).toBe('catmaze-final.sb3');
    expect(sheetOf(wrapper).text()).toContain('2 KB');
    expect(sheetOf(wrapper).find('[role="alert"]').exists()).toBe(false);
  });
  it('removes the card and moves focus to the input', async () => {
    const { wrapper } = await openScratch();
    await chooseFile(wrapper, new File(['x'], 'cat.sb3'));
    await sheetOf(wrapper).get('button[aria-label="Bỏ tệp"]').trigger('click');
    expect(sheetOf(wrapper).find('[title]').exists()).toBe(false);
    expect(document.activeElement).toBe(sheetOf(wrapper).get('input[accept]').element);
  });
  it('posts the file as multipart and opens the submission', async () => {
    const calls = mockApi({
      ...signedInRoutes(),
      'POST /problems/duongdi/submit/file': ok({ id: 'sub-7' }),
    });
    const { wrapper, router } = await openProblem();
    const push = vi.spyOn(router, 'push').mockResolvedValue(undefined);
    await expandSheet(wrapper);
    await pickLanguage(wrapper, 'Scratch 3');
    const file = new File(['x'], 'cat.sb3');
    await chooseFile(wrapper, file);
    await sheetOf(wrapper).get('button[type="submit"]').trigger('click');
    await flushPromises();
    const body = calls.find((call) => call.method === 'POST' && call.path.includes('/submit'))!
      .body as FormData;
    expect(body.get('language')).toBe(SCRATCH_ID);
    expect((body.get('file') as File).name).toBe('cat.sb3');
    expect(push).toHaveBeenCalledWith({ name: 'submission', params: { id: 'sub-7' } });
  });
  it('shows the server refusal in the alert region', async () => {
    mockApi({
      ...signedInRoutes(),
      'POST /problems/duongdi/submit/file': fail(422, 'validation_error', undefined, [
        { field: 'file', code: 'scratch_project_invalid', message: 'bad' },
      ]),
    });
    const { wrapper } = await openProblem();
    await expandSheet(wrapper);
    await pickLanguage(wrapper, 'Scratch 3');
    await chooseFile(wrapper, new File(['x'], 'cat.sb3'));
    await sheetOf(wrapper).get('button[type="submit"]').trigger('click');
    await flushPromises();
    expect(sheetOf(wrapper).get('[role="alert"]').text()).toBe(
      'Đây không phải dự án Scratch hợp lệ.',
    );
  });
  it('shows the disabled state with no input when uploads are off', async () => {
    const closed = problemDetail();
    closed.allowedLanguages = [
      closed.allowedLanguages[0]!,
      { ...closed.allowedLanguages[2]!, id: SCRATCH_ID, fileSizeLimit: 0 },
    ];
    mockApi(signedInRoutes(closed));
    const { wrapper } = await openProblem();
    await expandSheet(wrapper);
    await pickLanguage(wrapper, 'Scratch 3');
    const sheet = sheetOf(wrapper);
    expect(sheet.text()).toContain('Ngôn ngữ này không nhận tệp tải lên.');
    expect(sheet.find('input[accept]').exists()).toBe(false);
    expect(sheet.get('button[type="submit"]').attributes('aria-disabled')).toBe('true');
  });
  it('brings the editor back with the earlier code on switching to C++', async () => {
    const { wrapper } = await openScratch();
    await pickLanguage(wrapper, 'C++17');
    expect(sheetOf(wrapper).get('textarea').element.value).toBe('my cpp');
  });
});
