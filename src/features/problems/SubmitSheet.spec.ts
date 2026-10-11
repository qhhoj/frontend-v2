import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PHONE_QUERY } from '@/lib/use-media-query';
import { problemDetail } from '@/test/fixtures';
import { mockApi } from '@/test/mock-api';
import { stubMatchMedia } from '@/test/match-media';
import { mountApp } from '@/test/mount';
import { problemPageRoutes, signedInViewer } from '@/test/problem-routes';

vi.mock('@/components/code-editor-cm', () => {
  throw new Error('no editor in jsdom');
});

const signedInRoutes = (detail = problemDetail()) => ({
  ...signedInViewer(),
  ...problemPageRoutes(detail),
});
async function openProblem({ isPhone = true, path = '/problems/duongdi' } = {}) {
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
beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

describe('the sheet shell', () => {
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
