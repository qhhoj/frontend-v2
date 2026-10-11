import { flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSessionStore } from '@/stores/session.store';
import { shortLink } from '@/test/f5-fixtures';
import { sessionUser } from '@/test/fixtures';
import { mockApi, rateLimited } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import ShortLinkButton from './ShortLinkButton.vue';

const PATH = '/problems/aplusb';
const writeText = vi.fn<(text: string) => Promise<void>>();
const created = () => ({ status: 201, body: { data: shortLink({ path: PATH }) } });
const posts = (calls: { method: string; path: string }[]) =>
  calls.filter((call) => call.method === 'POST' && call.path === '/short-links').length;
const signIn = (id = sessionUser().id) => {
  const session = useSessionStore();
  session.user = sessionUser({ id });
  session.status = 'authenticated';
};
const mountSignedIn = () => {
  const wrapper = mountComponent(ShortLinkButton, { props: { path: PATH } });
  signIn();
  return wrapper;
};
const button = (wrapper: ReturnType<typeof mountSignedIn>) =>
  wrapper.get('[data-testid="short-link-button"]');

beforeEach(() => {
  writeText.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
});
afterEach(() => vi.useRealTimers());

describe('ShortLinkButton', () => {
  it('creates the link, copies the /s/ URL and announces it', async () => {
    const calls = mockApi({ 'POST /short-links': created() });
    const wrapper = mountSignedIn();
    await flushPromises();
    await button(wrapper).trigger('click');
    await flushPromises();
    expect(calls.find((call) => call.method === 'POST')?.body).toEqual({ path: PATH });
    expect(writeText).toHaveBeenCalledWith(`${location.origin}/s/k7m2xq`);
    expect(button(wrapper).text()).toBe('Đã sao chép');
    expect(wrapper.get('[aria-live="polite"]').text()).toBe(
      `Đã sao chép ${location.host}/s/k7m2xq`,
    );
  });

  it('sends one request for a double click, and none for a later click', async () => {
    const calls = mockApi({ 'POST /short-links': created() });
    const wrapper = mountSignedIn();
    await flushPromises();
    void button(wrapper).trigger('click');
    void button(wrapper).trigger('click');
    await flushPromises();
    await button(wrapper).trigger('click');
    await flushPromises();
    expect(posts(calls)).toBe(1);
    expect(writeText).toHaveBeenCalledTimes(2);
  });

  it('asks again after an account switch', async () => {
    const calls = mockApi({ 'POST /short-links': created() });
    const wrapper = mountSignedIn();
    await flushPromises();
    await button(wrapper).trigger('click');
    await flushPromises();
    signIn('0192a000-0000-7000-8000-000000000099');
    await flushPromises();
    await button(wrapper).trigger('click');
    await flushPromises();
    expect(posts(calls)).toBe(2);
  });

  it('locks with the daily-limit text on 429 and sends nothing more', async () => {
    const calls = mockApi({ 'POST /short-links': rateLimited(3600) });
    const wrapper = mountSignedIn();
    await flushPromises();
    await button(wrapper).trigger('click');
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toContain(
      'Hôm nay bạn đã tạo tối đa 20 liên kết ngắn.',
    );
    expect(button(wrapper).attributes('aria-disabled')).toBe('true');
    expect(wrapper.find('[data-testid="inline-bit"]').exists()).toBe(true);
    await button(wrapper).trigger('click');
    await flushPromises();
    expect(posts(calls)).toBe(1);
  });
});
