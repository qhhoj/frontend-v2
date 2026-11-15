import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';

/** Opens the `ComboBox` under `selector`. */
export async function openSelect(wrapper: VueWrapper, selector: string) {
  await wrapper.get(`${selector} [role="combobox"]`).trigger('click');
  await flushPromises();
}

/** The open list is teleported to `document.body` (or the open dialog), outside the wrapper. */
export const optionTexts = () =>
  [...document.body.querySelectorAll('[role="option"]')].map((option) =>
    option.textContent?.trim(),
  );

/** Picks the open list's option named `text`. */
export async function pickOption(text: string) {
  const option = [...document.body.querySelectorAll<HTMLElement>('[role="option"]')].find(
    (candidate) => candidate.textContent?.trim() === text,
  );
  if (!option) throw new Error(`No option "${text}"`);
  option.click();
  await flushPromises();
}

/** Types into the open list's search box. */
export async function typeFilter(text: string) {
  const filter = document.body.querySelector<HTMLInputElement>('input[role="searchbox"]');
  if (!filter) throw new Error('No filter input');
  filter.value = text;
  filter.dispatchEvent(new Event('input'));
  await flushPromises();
}
