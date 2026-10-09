import type { VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TEXT_DEBOUNCE_MS } from '@/lib/use-debounced-text';
import { mountComponent } from '@/test/mount';
import IndexSearchBox from './IndexSearchBox.vue';

const props = { value: '', label: 'Tìm', placeholder: 'Khóa hoặc tên…', clearLabel: 'Xóa ô tìm' };

afterEach(() => vi.useRealTimers());

describe('IndexSearchBox', () => {
  it('commits the trimmed text once, after the typing pauses', async () => {
    vi.useFakeTimers();
    const wrapper = mountComponent(IndexSearchBox, { props });
    await wrapper.get('input').setValue('  hc');
    await wrapper.get('input').setValue('  hcmus ');
    await vi.advanceTimersByTimeAsync(TEXT_DEBOUNCE_MS - 1);
    expect(wrapper.emitted('commit')).toBeUndefined();
    await vi.advanceTimersByTimeAsync(1);
    expect(wrapper.emitted('commit')).toEqual([['hcmus']]);
  });

  it('follows the address when it changes from outside', async () => {
    const wrapper = mountComponent(IndexSearchBox, { props }) as unknown as VueWrapper<{
      value: string;
    }>;
    await wrapper.setProps({ value: 'olympic' });
    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('olympic');
  });

  it('shows the clear button only with text, clears at once and keeps the focus in the box', async () => {
    const wrapper = mountComponent(IndexSearchBox, { props: { ...props, value: 'hcmus' } });
    await wrapper.get('button[aria-label="Xóa ô tìm"]').trigger('click');
    expect(wrapper.emitted('commit')).toEqual([['']]);
    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('');
    expect(wrapper.find('button[aria-label="Xóa ô tìm"]').exists()).toBe(false);
    expect(document.activeElement).toBe(wrapper.get('input').element);
  });

  it('names the box for assistive technology', () => {
    const wrapper = mountComponent(IndexSearchBox, { props });
    const input = wrapper.get('input');
    expect(wrapper.get(`label[for="${input.attributes('id')}"]`).text()).toBe('Tìm');
    expect(input.attributes('type')).toBe('search');
  });
});
