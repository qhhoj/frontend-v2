import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import type { PreviewSource } from '@/api/types/admin-common';
import { mockApi, ok, rateLimited } from '@/test/mock-api';
import type { ApiCall } from '@/test/mock-api';
import { anonymousViewer } from '@/test/problem-routes';
import { mountComponent } from '@/test/mount';
import { PREVIEW_DELAY_MS, useRenderPreview } from './use-render-preview';

/** The router asks for the session on mount; only the preview POSTs are under test. */
const posts = (calls: ApiCall[]) => calls.filter((call) => call.method === 'POST');

const text = ref('');
const source = ref<PreviewSource>('problem');
let preview!: ReturnType<typeof useRenderPreview>;
const Host = defineComponent({
  setup() {
    preview = useRenderPreview(
      () => text.value,
      () => source.value,
    );
    return () => h('div');
  },
});

beforeEach(() => {
  vi.useFakeTimers();
  text.value = '';
  source.value = 'problem';
});
afterEach(() => vi.useRealTimers());

describe('useRenderPreview', () => {
  it('asks once per pause, 500 ms after the last key', async () => {
    const calls = mockApi({
      ...anonymousViewer,
      'POST /problems/render-preview': ({ body }) =>
        ok({ html: `<p>${(body as { markdown: string }).markdown}</p>` }),
    });
    mountComponent(Host);
    for (const typed of ['a', 'ab', 'abc']) {
      text.value = typed;
      await vi.advanceTimersByTimeAsync(200);
    }
    expect(posts(calls)).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(PREVIEW_DELAY_MS);
    await flushPromises();
    expect(posts(calls).map((call) => call.body)).toEqual([{ style: 'problem', markdown: 'abc' }]);
    expect(preview.html.value).toBe('<p>abc</p>');
  });

  it('never lets an older answer replace a newer one', async () => {
    let releaseFirst!: () => void;
    const first = new Promise<void>((resolve) => (releaseFirst = resolve));
    mockApi({
      ...anonymousViewer,
      'POST /problems/render-preview': ({ body }) => {
        const markdown = (body as { markdown: string }).markdown;
        return ok({ html: markdown });
      },
    });
    const answer = globalThis.fetch;
    vi.stubGlobal('fetch', async (input: string, init: RequestInit) => {
      const body = typeof init.body === 'string' ? init.body : '';
      if (body.includes('"old"')) await first;
      return answer(input, init);
    });
    mountComponent(Host);
    text.value = 'old';
    await vi.advanceTimersByTimeAsync(PREVIEW_DELAY_MS);
    text.value = 'new';
    await vi.advanceTimersByTimeAsync(PREVIEW_DELAY_MS);
    await flushPromises();
    releaseFirst();
    await flushPromises();
    expect(preview.html.value).toBe('new');
  });

  it('keeps the last preview, flags a 429 and says how many seconds to wait', async () => {
    let isLimited = false;
    mockApi({
      ...anonymousViewer,
      'POST /problems/render-preview': () => (isLimited ? rateLimited(42) : ok({ html: 'kept' })),
    });
    mountComponent(Host);
    text.value = 'x';
    await vi.advanceTimersByTimeAsync(PREVIEW_DELAY_MS);
    await flushPromises();
    isLimited = true;
    text.value = 'y';
    await vi.advanceTimersByTimeAsync(PREVIEW_DELAY_MS);
    await flushPromises();
    expect(preview.html.value).toBe('kept');
    expect(preview.isRateLimited.value).toBe(true);
    expect(preview.retryAfterSeconds.value).toBe(42);
  });

  it('previews a static page through the flatpage endpoint, which takes the text as `content`', async () => {
    const calls = mockApi({
      ...anonymousViewer,
      'POST /admin/site/pages/render-preview': () => ok({ html: '<p>trang</p>' }),
    });
    source.value = 'flatpage';
    mountComponent(Host);
    text.value = '# Quy định';
    await vi.advanceTimersByTimeAsync(PREVIEW_DELAY_MS);
    await flushPromises();
    expect(posts(calls).map((call) => [call.path, call.body])).toEqual([
      ['/admin/site/pages/render-preview', { content: '# Quy định' }],
    ]);
    expect(preview.html.value).toBe('<p>trang</p>');
  });

  it('sends nothing for an empty text and clears the preview', async () => {
    const calls = mockApi({ ...anonymousViewer });
    mountComponent(Host);
    text.value = '   ';
    await vi.advanceTimersByTimeAsync(PREVIEW_DELAY_MS);
    expect(posts(calls)).toHaveLength(0);
    expect(preview.html.value).toBe('');
  });

  it('says an update is on its way from the keystroke until the answer, and when the answer came', async () => {
    mockApi({
      ...anonymousViewer,
      'POST /problems/render-preview': () => ok({ html: '<p>x</p>' }),
    });
    mountComponent(Host);
    expect(preview.isUpdating.value).toBe(false);
    text.value = 'x';
    await flushPromises();
    expect(preview.isUpdating.value).toBe(true);
    await vi.advanceTimersByTimeAsync(PREVIEW_DELAY_MS);
    await flushPromises();
    expect(preview.isUpdating.value).toBe(false);
    expect(preview.updatedAt.value).toBeInstanceOf(Date);
  });

  it('is not updating while paused by a 429 or when the text is empty', async () => {
    mockApi({ ...anonymousViewer, 'POST /problems/render-preview': () => rateLimited(42) });
    mountComponent(Host);
    text.value = 'x';
    await vi.advanceTimersByTimeAsync(PREVIEW_DELAY_MS);
    await flushPromises();
    expect(preview.isUpdating.value).toBe(false);
    text.value = 'y';
    await flushPromises();
    expect(preview.isUpdating.value).toBe(false);
    text.value = '  ';
    await flushPromises();
    expect(preview.isUpdating.value).toBe(false);
  });

  it('sends nothing while the server asked to wait, and resumes after the wait', async () => {
    const calls = mockApi({
      ...anonymousViewer,
      'POST /problems/render-preview': () => rateLimited(42),
    });
    mountComponent(Host);
    text.value = 'x';
    await vi.advanceTimersByTimeAsync(PREVIEW_DELAY_MS);
    await flushPromises();
    expect(posts(calls)).toHaveLength(1);
    text.value = 'y';
    await vi.advanceTimersByTimeAsync(PREVIEW_DELAY_MS * 2);
    await flushPromises();
    expect(posts(calls)).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(42_000);
    text.value = 'z';
    await vi.advanceTimersByTimeAsync(PREVIEW_DELAY_MS);
    await flushPromises();
    expect(posts(calls)).toHaveLength(2);
  });
});
