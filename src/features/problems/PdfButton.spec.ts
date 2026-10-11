import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { probePdf } from '@/api/pdf';
import type { PdfProbe } from '@/api/pdf';
import { ApiError } from '@/api/client';
import { mockApi } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';
import PdfButton from './PdfButton.vue';

vi.mock('@/api/pdf', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  probePdf: vi.fn(),
}));
const probe = vi.mocked(probePdf);
const rendering: PdfProbe = { state: 'rendering', retryAfterMs: 3000 };
const neverAnswers = () => new Promise<PdfProbe>(() => {});
type Mounted = VueWrapper<InstanceType<typeof PdfButton>>;
const open = () =>
  mountComponent(PdfButton, { props: { code: 'duongdi', lang: 'vi' } }) as unknown as Mounted;
/** The signal the component passed to the probe at call `index`. */
const signalOf = (index: number) => probe.mock.calls[index]![2]!;
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
    expect(wrapper.get('button').text()).toBe('Tải đề dạng PDF');
    expect(wrapper.get('[role="status"]').text()).toBe('');
  });
  it('starts no countdown timer until the server asks the viewer to wait', () => {
    open();
    expect(vi.getTimerCount()).toBe(0);
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
  it('keeps one button element from idle through preparing to failed', async () => {
    probe.mockRejectedValue(new ApiError('generic', 500, 'x'));
    const wrapper = open();
    const idle = wrapper.get('button').element;
    await wrapper.get('button').trigger('click');
    expect(wrapper.get('button').element).toBe(idle);
    await flushPromises();
    expect(wrapper.get('button').element).toBe(idle);
    expect(wrapper.get('button').attributes('aria-busy')).toBeUndefined();
  });
  it('keeps keyboard focus on the button while it prepares, then moves it to the Open PDF link', async () => {
    probe.mockResolvedValueOnce(rendering).mockResolvedValue({ state: 'ready' });
    const wrapper = open();
    (wrapper.get('button').element as HTMLElement).focus(); // the keyboard user's Tab
    await wrapper.get('button').trigger('click'); // what Enter does on a focused button
    await flushPromises();
    expect(document.activeElement).toBe(wrapper.get('button').element);
    await vi.advanceTimersByTimeAsync(3000);
    expect(document.activeElement).toBe(wrapper.get('a').element);
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
  it('moves focus back to the button when the language changes while the link has focus', async () => {
    probe.mockResolvedValue({ state: 'ready' });
    const wrapper = open();
    (wrapper.get('button').element as HTMLElement).focus();
    await wrapper.get('button').trigger('click');
    await flushPromises();
    expect(document.activeElement).toBe(wrapper.get('a').element);
    await wrapper.setProps({ lang: 'en' });
    await flushPromises();
    expect(wrapper.find('a').exists()).toBe(false);
    expect(document.activeElement).toBe(wrapper.get('button').element);
  });
  it('offers Try again after a failure and prepares again once the 3 s floor has passed', async () => {
    probe.mockRejectedValueOnce(new ApiError('generic', 500, 'x')).mockResolvedValue(rendering);
    const wrapper = open();
    await wrapper.get('button').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Không thể chuẩn bị PDF');
    expect(wrapper.get('[role="status"]').text()).toBe('Không thể chuẩn bị PDF');
    await vi.advanceTimersByTimeAsync(3000);
    expect(wrapper.get('button').text()).toBe('Thử lại');
    await wrapper.get('button').trigger('click');
    await flushPromises();
    expect(wrapper.find('button[aria-busy="true"]').exists()).toBe(true);
  });
  it('shows the failed text once visibly and hides it from assistive tech, the status region announces it', async () => {
    probe.mockRejectedValue(new ApiError('generic', 500, 'x'));
    const wrapper = open();
    await wrapper.get('button').trigger('click');
    await flushPromises();
    const visible = wrapper.get('.text-negative');
    expect(visible.text()).toBe('Không thể chuẩn bị PDF');
    expect(visible.attributes('aria-hidden')).toBe('true');
  });
  it('says the statement has no PDF on a 404 and that there are too many requests on a 429', async () => {
    probe.mockRejectedValueOnce(new ApiError('not_found', 404, 'x'));
    const missing = open();
    await missing.get('button').trigger('click');
    await flushPromises();
    expect(missing.get('[role="status"]').text()).toBe('Đề bài này không có bản PDF');
    missing.unmount();

    probe.mockResolvedValueOnce({
      state: 'unavailable',
      reason: 'rate_limited',
      retryAfterMs: 60_000,
    });
    const limited = open();
    await limited.get('button').trigger('click');
    await flushPromises();
    expect(limited.get('[role="status"]').text()).toBe('Quá nhiều yêu cầu PDF');
  });
  it('makes the viewer wait out Retry-After after 503 or 429, counting the seconds down', async () => {
    probe.mockResolvedValue({
      state: 'unavailable',
      reason: 'pdf_unavailable',
      retryAfterMs: 30_000,
    });
    const wrapper = open();
    await wrapper.get('button').trigger('click');
    await flushPromises();
    const retry = () => wrapper.get('button');
    expect(retry().attributes('aria-disabled')).toBe('true');
    expect(retry().classes()).toContain('cursor-not-allowed');
    expect(retry().text()).toContain('30');
    await retry().trigger('click');
    expect(probe).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(retry().attributes('aria-disabled')).toBe('false');
    expect(retry().classes()).not.toContain('cursor-not-allowed');
    expect(retry().text()).toBe('Thử lại');
    expect(vi.getTimerCount()).toBe(0);
  });
  it('aborts the probe in flight when the language changes', async () => {
    probe.mockImplementation(neverAnswers);
    const wrapper = open();
    await wrapper.get('button').trigger('click');
    await wrapper.setProps({ lang: 'en' });
    expect(signalOf(0).aborted).toBe(true);
  });
  it('aborts the probe in flight when the component unmounts', async () => {
    probe.mockImplementation(neverAnswers);
    const wrapper = open();
    await wrapper.get('button').trigger('click');
    wrapper.unmount();
    expect(signalOf(0).aborted).toBe(true);
  });
});
