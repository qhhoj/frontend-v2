import { flushPromises } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { mountComponent } from '@/test/mount';
import ComboBox from './ComboBox.vue';

const OPTIONS = [
  { value: 'cpp', label: 'C++ 20' },
  { value: 'py', label: 'Python 3' },
  { value: 'java', label: 'Java 21' },
];
const box = () => document.querySelector<HTMLElement>('[role="combobox"]')!;
const press = (target: HTMLElement, key: string) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

/** A ComboBox over `OPTIONS` bound to a ref; resolves to that ref and the texts it was asked to filter by. */
async function mountBox(props: Record<string, unknown> = {}) {
  const model = ref<string | number | null>('cpp');
  const filters: string[] = [];
  mountComponent(
    defineComponent({
      setup: () => () =>
        h(ComboBox, {
          ...props,
          options: OPTIONS,
          'aria-label': 'Ngôn ngữ',
          modelValue: model.value,
          'onUpdate:modelValue': (value: string | number | null | undefined) =>
            (model.value = value ?? null),
          onFilter: ({ value }: { value: string }) => filters.push(value),
        }),
    }),
  );
  await flushPromises();
  return { model, filters };
}

describe('ComboBox', () => {
  it('opens from the keyboard on the current choice and picks with the arrows and Enter, focus back on the box', async () => {
    const { model } = await mountBox();
    box().focus();
    press(box(), 'ArrowDown');
    await flushPromises();
    expect(box().getAttribute('aria-expanded')).toBe('true');
    const active = () => document.getElementById(box().getAttribute('aria-activedescendant')!)!;
    expect(active().textContent?.trim()).toBe('C++ 20');
    press(box(), 'ArrowDown');
    press(box(), 'Enter');
    await flushPromises();
    expect(model.value).toBe('py');
    expect(box().getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(box());
  });

  it('narrows the list to labels containing the search text, reports it, and clears with Delete', async () => {
    const { model, filters } = await mountBox({
      filter: true,
      clearable: true,
      filterLabel: 'Tìm',
    });
    box().click();
    await flushPromises();
    const search = document.querySelector<HTMLInputElement>('input[role="searchbox"]')!;
    expect(document.activeElement).toBe(search);
    search.value = 'java';
    search.dispatchEvent(new Event('input'));
    await flushPromises();
    expect(
      [...document.querySelectorAll('[role="option"]')].map((option) => option.textContent?.trim()),
    ).toEqual(['Java 21']);
    expect(filters).toEqual(['java']);
    press(search, 'Enter');
    await flushPromises();
    expect(model.value).toBe('java');
    press(box(), 'Delete');
    await flushPromises();
    expect(model.value).toBeNull();
  });

  it('reopens on the current choice after a filtered close, so Enter keeps it', async () => {
    const { model } = await mountBox({ filter: true, filterLabel: 'Tìm' });
    box().click();
    await flushPromises();
    const search = () => document.querySelector<HTMLInputElement>('input[role="searchbox"]')!;
    const type = (text: string) => {
      search().value = text;
      search().dispatchEvent(new Event('input'));
    };
    type('java');
    press(search(), 'Enter'); // the current choice is now the last option
    await flushPromises();
    press(box(), 'Enter');
    await flushPromises();
    type('py');
    press(search(), 'Escape');
    await flushPromises();
    press(box(), 'Enter');
    await flushPromises();
    press(search(), 'Enter');
    await flushPromises();
    expect(model.value).toBe('java');
  });

  it('keeps the Escape that closes its list from a sheet or panel around it', async () => {
    await mountBox();
    press(box(), 'ArrowDown');
    await flushPromises();
    const outer = vi.fn();
    document.body.addEventListener('keydown', outer);
    press(box(), 'Escape');
    await flushPromises();
    document.body.removeEventListener('keydown', outer);
    expect(box().getAttribute('aria-expanded')).toBe('false');
    expect(outer).not.toHaveBeenCalled();
  });
});
