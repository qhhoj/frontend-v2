import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { mockApi, ok, rateLimited } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { staffViewer } from '@/test/admin-routes';
import { PREVIEW_DELAY_MS } from '../ui/use-render-preview';
import FlatpagePreview from './FlatpagePreview.vue';

const SAVED = { savedContent: '## Cũ', savedHtml: '<h2>Cũ</h2>' };
/** `mountComponent` types its wrapper loosely, so the props of `setProps` are cast to the component's own. */
const mountPreview = (content: string) =>
  mountComponent(FlatpagePreview, { props: { content, ...SAVED } }) as unknown as VueWrapper<
    InstanceType<typeof FlatpagePreview>
  >;

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('FlatpagePreview', () => {
  it('shows the saved sanitised page while the text is the saved text', async () => {
    mockApi({ ...staffViewer(['flatpages.change_flatpage']) });
    const wrapper = mountPreview('## Cũ');
    await flushPromises();
    expect(wrapper.get('[data-testid="preview"]').html()).toContain('<h2>Cũ</h2>');
    expect(wrapper.get('[data-testid="preview-status"]').text()).toBe('Bản đã lưu');
  });

  it('goes from "Đang cập nhật…" to "Đã cập nhật hh:mm:ss" with the server’s sanitised HTML', async () => {
    mockApi({
      ...staffViewer(['flatpages.change_flatpage']),
      'POST /admin/site/pages/render-preview': () => ok({ html: '<h2>Mới</h2>' }),
    });
    const wrapper = mountPreview('## Cũ');
    await wrapper.setProps({ content: '## Mới' });
    expect(wrapper.get('[data-testid="preview-status"]').text()).toBe('Đang cập nhật…');
    await vi.advanceTimersByTimeAsync(PREVIEW_DELAY_MS);
    await flushPromises();
    expect(wrapper.get('[data-testid="preview"]').html()).toContain('<h2>Mới</h2>');
    expect(wrapper.get('[data-testid="preview-status"]').text()).toMatch(
      /^Đã cập nhật \d{2}:\d{2}:\d{2}$/,
    );
  });

  it('after a 429 keeps the last preview, says how long to wait and that saving still works', async () => {
    let isLimited = false;
    mockApi({
      ...staffViewer(['flatpages.change_flatpage']),
      'POST /admin/site/pages/render-preview': () =>
        isLimited ? rateLimited(12) : ok({ html: '<p>kept</p>' }),
    });
    const wrapper = mountPreview('## Cũ');
    await wrapper.setProps({ content: 'a' });
    await vi.advanceTimersByTimeAsync(PREVIEW_DELAY_MS);
    await flushPromises();
    isLimited = true;
    await wrapper.setProps({ content: 'b' });
    await vi.advanceTimersByTimeAsync(PREVIEW_DELAY_MS);
    await flushPromises();
    expect(wrapper.get('[data-testid="preview"]').html()).toContain('<p>kept</p>');
    expect(wrapper.get('[data-testid="preview-status"]').text()).toBe('Tạm dừng');
    expect(wrapper.get('[role="status"]').text()).toContain('gõ tiếp sau 12 giây');
    expect(wrapper.get('[role="status"]').text()).toContain('Lưu trang vẫn bình thường.');
  });

  it('clears the preview, not the saved page, when the text is emptied', async () => {
    mockApi({ ...staffViewer(['flatpages.change_flatpage']) });
    const wrapper = mountPreview('## Cũ');
    await wrapper.setProps({ content: '' });
    await vi.advanceTimersByTimeAsync(PREVIEW_DELAY_MS);
    await flushPromises();
    expect(wrapper.get('[data-testid="preview"]').text()).toBe('');
  });
});
