import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';

/** Opens the PrimeVue `Select` under `selector` (its focusable label carries `role="combobox"`). */
export async function openSelect(wrapper: VueWrapper, selector: string) {
  await wrapper.get(`${selector} [role="combobox"]`).trigger('click');
  await flushPromises();
}

/** The open overlay is appended to `document.body`, outside the wrapper. */
export const optionTexts = () =>
  [...document.body.querySelectorAll('[role="option"]')].map((option) =>
    option.textContent?.trim(),
  );

/** Picks the open overlay's option named `text`. PrimeVue chooses on `mousedown`, as a pointer does. */
export async function pickOption(text: string) {
  const option = [...document.body.querySelectorAll<HTMLElement>('[role="option"]')].find(
    (candidate) => candidate.textContent?.trim() === text,
  );
  if (!option) throw new Error(`No option "${text}"`);
  option.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  await flushPromises();
}

/** Types into the open overlay's filter box. */
export async function typeFilter(text: string) {
  const filter = document.body.querySelector<HTMLInputElement>('input[role="searchbox"]');
  if (!filter) throw new Error('No filter input');
  filter.value = text;
  filter.dispatchEvent(new Event('input'));
  await flushPromises();
}
