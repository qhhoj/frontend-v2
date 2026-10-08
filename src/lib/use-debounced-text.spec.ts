import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { TEXT_DEBOUNCE_MS, useDebouncedText } from './use-debounced-text';

beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] }));
afterEach(() => vi.useRealTimers());

function mountBox(initial = 'abc') {
  const source = ref(initial);
  const commit = vi.fn();
  let text!: ReturnType<typeof useDebouncedText>;
  const wrapper = mount(
    defineComponent({
      setup() {
        text = useDebouncedText(() => source.value, commit);
        return () => h('div');
      },
    }),
  );
  return { source, commit, wrapper, text: () => text };
}

describe('useDebouncedText', () => {
  it('commits the trimmed text once, after the last key', async () => {
    const box = mountBox('');
    box.text().value = 'a';
    await nextTick();
    await vi.advanceTimersByTimeAsync(TEXT_DEBOUNCE_MS - 1);
    box.text().value = ' ab ';
    await nextTick();
    await vi.advanceTimersByTimeAsync(TEXT_DEBOUNCE_MS - 1);
    expect(box.commit).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(box.commit.mock.calls).toEqual([['ab']]);
  });

  it('cancels the pending commit when the text goes back to the value the source already has', async () => {
    const box = mountBox('abc');
    box.text().value = 'abcd';
    await nextTick();
    box.text().value = ' abc ';
    await nextTick();
    await vi.advanceTimersByTimeAsync(TEXT_DEBOUNCE_MS * 2);
    expect(box.commit).not.toHaveBeenCalled();
  });

  it('follows the source when it changes from outside, without committing it back', async () => {
    const box = mountBox('abc');
    box.source.value = 'xyz';
    await nextTick();
    expect(box.text().value).toBe('xyz');
    await vi.advanceTimersByTimeAsync(TEXT_DEBOUNCE_MS * 2);
    expect(box.commit).not.toHaveBeenCalled();
  });

  it('leaves no timer behind when the component unmounts', async () => {
    const box = mountBox('');
    box.text().value = 'a';
    await nextTick();
    box.wrapper.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
