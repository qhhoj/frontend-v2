import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import { PREVIEW_DELAY_MS, useDebouncedPreview } from './use-debounced-preview';

const text = ref('');
const isActive = ref(false);
const render = vi.fn((markdown: string) => Promise.resolve(`<p>${markdown}</p>`));
let preview!: ReturnType<typeof useDebouncedPreview>;
const Host = defineComponent({
  setup() {
    preview = useDebouncedPreview(() => text.value, render, { isActive: () => isActive.value });
    return () => h('div');
  },
});

beforeEach(() => {
  vi.useFakeTimers();
  render.mockClear();
  text.value = '';
  isActive.value = false;
});
afterEach(() => vi.useRealTimers());

describe('useDebouncedPreview', () => {
  it('sends nothing while inactive, and renders the current text once it turns active', async () => {
    mount(Host);
    text.value = '**a**';
    await flushPromises();
    vi.advanceTimersByTime(PREVIEW_DELAY_MS * 2);
    expect(render).not.toHaveBeenCalled();

    isActive.value = true;
    await flushPromises();
    vi.advanceTimersByTime(PREVIEW_DELAY_MS);
    await flushPromises();
    expect(render).toHaveBeenCalledExactlyOnceWith('**a**');
    expect(preview.html.value).toBe('<p>**a**</p>');
  });
});
