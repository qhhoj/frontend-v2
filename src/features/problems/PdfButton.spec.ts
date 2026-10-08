import { flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { probePdf } from '@/api/pdf';
import type { PdfProbe } from '@/api/pdf';
import { ApiError } from '@/api/client';
import { mockApi } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';
import PdfButton from './PdfButton.vue';

vi.mock('@/api/pdf', () => ({ probePdf: vi.fn() }));
const probe = vi.mocked(probePdf);
const rendering: PdfProbe = { state: 'rendering', retryAfterMs: 3000 };
const open = () => mountComponent(PdfButton, { props: { code: 'duongdi', lang: 'vi' } });
beforeEach(() => {
  mockApi({ ...anonymousViewer }); // the router `mountComponent` installs asks /auth/me
  vi.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
  });
});
afterEach(() => {
  vi.useRealTimers();
  probe.mockReset();
});

describe('PdfButton', () => {
  it('shows a plain PDF button and an empty status region before any click', () => {
    const wrapper = open();
    expect(wrapper.get('button').text()).toBe('PDF');
    expect(wrapper.get('[role="status"]').text()).toBe('');
  });
  it('shows a busy ring button without a percentage while the PDF renders', async () => {
    probe.mockResolvedValue(rendering);
    const wrapper = open();
    await wrapper.get('button').trigger('click');
    await flushPromises();
    const busy = wrapper.get('button[aria-busy="true"]');
    expect(busy.text()).toContain('Đang chuẩn bị PDF');
    expect(busy.text()).not.toMatch(/%/);
    expect(busy.attributes('aria-disabled')).toBe('true');
    expect(wrapper.find('a').exists()).toBe(false);
  });
  it('turns into an Open PDF link to a new tab and says PDF ready once', async () => {
    probe.mockResolvedValueOnce(rendering).mockResolvedValue({ state: 'ready' });
    const wrapper = open();
    await wrapper.get('button').trigger('click');
    await vi.advanceTimersByTimeAsync(3000);
    const link = wrapper.get('a');
    expect(link.attributes('href')).toBe('/api/internal/problems/duongdi/pdf?lang=vi');
    expect(link.attributes('target')).toBe('_blank');
    expect(link.attributes('rel')).toContain('noopener');
    expect(wrapper.findAll('[role="status"]')).toHaveLength(1);
    expect(wrapper.get('[role="status"]').text()).toBe('PDF đã sẵn sàng');
    await vi.advanceTimersByTimeAsync(30_000);
    expect(wrapper.get('[role="status"]').text()).toBe('PDF đã sẵn sàng');
    expect(probe).toHaveBeenCalledTimes(2);
  });
  it('moves focus to the link when the busy button had focus', async () => {
    probe.mockResolvedValueOnce(rendering).mockResolvedValue({ state: 'ready' });
    const wrapper = open();
    await wrapper.get('button').trigger('click');
    await flushPromises();
    (wrapper.get('button[aria-busy="true"]').element as HTMLElement).focus();
    await vi.advanceTimersByTimeAsync(3000);
    expect(document.activeElement).toBe(wrapper.get('a').element);
  });
  it('offers Try again after a failure and prepares again on click', async () => {
    probe.mockRejectedValueOnce(new ApiError('generic', 500, 'x')).mockResolvedValue(rendering);
    const wrapper = open();
    await wrapper.get('button').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Không thể chuẩn bị PDF');
    expect(wrapper.get('[role="status"]').text()).toBe('Không thể chuẩn bị PDF');
    await wrapper.get('button').trigger('click');
    await flushPromises();
    expect(wrapper.find('button[aria-busy="true"]').exists()).toBe(true);
  });
  it('makes the viewer wait out Retry-After after 503 or 429, counting the seconds down', async () => {
    probe.mockResolvedValue({ state: 'unavailable', retryAfterMs: 30_000 });
    const wrapper = open();
    await wrapper.get('button').trigger('click');
    await flushPromises();
    const retry = () => wrapper.get('button');
    expect(retry().attributes('aria-disabled')).toBe('true');
    expect(retry().text()).toContain('30');
    await retry().trigger('click');
    expect(probe).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(retry().attributes('aria-disabled')).toBe('false');
    expect(retry().text()).toBe('Thử lại');
  });
});
