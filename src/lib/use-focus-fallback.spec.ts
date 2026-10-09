import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { useFocusFallback } from './use-focus-fallback';

function mountList(initial: number) {
  const count = ref<number | undefined>(initial);
  const target = ref<HTMLElement | null>(null);
  const Host = defineComponent({
    setup() {
      useFocusFallback(
        () => count.value,
        () => target.value,
      );
      return () =>
        h('div', { ref: target, tabindex: -1, id: 'list' }, [
          count.value ? h('button', { id: 'row' }, 'row') : null,
          h('input', { id: 'elsewhere' }),
        ]);
    },
  });
  const wrapper = mount(Host, { attachTo: document.body });
  return { count, wrapper };
}

describe('useFocusFallback', () => {
  it('moves focus to the container when the focused control leaves with a shrinking list', async () => {
    const { count, wrapper } = mountList(2);
    wrapper.get<HTMLElement>('#row').element.focus();
    count.value = 0;
    await nextTick();
    await nextTick();
    expect(document.activeElement?.id).toBe('list');
    wrapper.unmount();
  });

  it('leaves focus alone when it is still on a live control, when the list grows, and on the first value', async () => {
    const { count, wrapper } = mountList(2);
    wrapper.get<HTMLElement>('#elsewhere').element.focus();
    count.value = 1;
    await nextTick();
    await nextTick();
    expect(document.activeElement?.id).toBe('elsewhere');
    (document.activeElement as HTMLElement).blur();
    count.value = 3;
    await nextTick();
    await nextTick();
    expect(document.activeElement).toBe(document.body);
    count.value = undefined;
    await nextTick();
    count.value = 1;
    await nextTick();
    await nextTick();
    expect(document.activeElement).toBe(document.body);
    wrapper.unmount();
  });
});
