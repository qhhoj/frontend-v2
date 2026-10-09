import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { useNow } from './use-now';

const Clock = defineComponent({
  setup() {
    const now = useNow(1000);
    return () => h('p', String(now.value));
  },
});
const setHidden = (hidden: boolean) => {
  Object.defineProperty(document, 'hidden', { configurable: true, value: hidden });
  document.dispatchEvent(new Event('visibilitychange'));
};

describe('useNow', () => {
  afterEach(() => {
    setHidden(false);
    vi.useRealTimers();
  });

  it('ticks while visible, stands still while the tab is hidden, and catches up on return', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    vi.setSystemTime(1_000_000);
    const wrapper = mount(Clock);
    await vi.advanceTimersByTimeAsync(3000);
    expect(wrapper.text()).toBe('1003000');
    setHidden(true);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(wrapper.text()).toBe('1003000');
    expect(vi.getTimerCount()).toBe(0);
    setHidden(false);
    await vi.advanceTimersByTimeAsync(0);
    expect(wrapper.text()).toBe('1063000');
    await vi.advanceTimersByTimeAsync(1000);
    expect(wrapper.text()).toBe('1064000');
    wrapper.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
