import { describe, expect, it } from 'vitest';
import { mountComponent } from '@/test/mount';
import ScrollRegion from './ScrollRegion.vue';

const mountRegion = (widths: { scroll: number; client: number; left?: number }) => {
  const wrapper = mountComponent(ScrollRegion, {
    props: { label: 'Bảng thử' },
    slots: { default: '<table><tbody><tr><td>x</td></tr></tbody></table>' },
  });
  const scroller = wrapper.get('[role="region"]').element as HTMLElement;
  Object.defineProperty(scroller, 'scrollWidth', { value: widths.scroll, configurable: true });
  Object.defineProperty(scroller, 'clientWidth', { value: widths.client, configurable: true });
  Object.defineProperty(scroller, 'scrollLeft', { value: widths.left ?? 0, configurable: true });
  return { wrapper, scroller };
};

describe('ScrollRegion', () => {
  it('shows no cue when the content fits', async () => {
    const { wrapper, scroller } = mountRegion({ scroll: 300, client: 300 });
    scroller.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-testid="scroll-hint"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="scroll-shade-right"]').exists()).toBe(false);
  });

  it('shows a swipe hint and a right shade while content hides to the right', async () => {
    const { wrapper, scroller } = mountRegion({ scroll: 900, client: 300 });
    scroller.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[data-testid="scroll-hint"]').text()).toBe('Vuốt ngang để xem thêm cột →');
    expect(wrapper.find('[data-testid="scroll-shade-right"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="scroll-shade-left"]').exists()).toBe(false);
  });

  it('moves the shade to the left edge once scrolled to the end', async () => {
    const { wrapper, scroller } = mountRegion({ scroll: 900, client: 300, left: 600 });
    scroller.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-testid="scroll-shade-right"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="scroll-hint"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="scroll-shade-left"]').exists()).toBe(true);
  });

  it('is a labelled, keyboard-focusable region', () => {
    const { wrapper } = mountRegion({ scroll: 300, client: 300 });
    const region = wrapper.get('[role="region"]');
    expect(region.attributes('aria-label')).toBe('Bảng thử');
    expect(region.attributes('tabindex')).toBe('0');
  });
});
