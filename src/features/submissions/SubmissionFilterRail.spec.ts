import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { problemMeta } from '@/test/fixtures';
import { mockApi } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';
import SubmissionFilterRail from './SubmissionFilterRail.vue';
import { parseSubmissionFilters } from './use-submission-filters';

beforeEach(() => {
  mockApi({ ...anonymousViewer });
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});
afterEach(() => vi.useRealTimers());

const mountRail = () =>
  mountComponent(SubmissionFilterRail, {
    props: { filters: parseSubmissionFilters({}), languages: problemMeta().languages },
  });

describe('the submission filter rail', () => {
  it('emits the verdict filter when Accepted is ticked', async () => {
    const wrapper = mountRail();
    await wrapper.get('input[type="checkbox"][value="AC"]').setValue(true);
    expect(wrapper.emitted('update')).toEqual([[{ results: ['AC'] }]]);
  });

  it('emits one update 300 ms after the last key of a burst, and no timer left after unmount', async () => {
    const wrapper = mountRail();
    const field = wrapper.get('input[name="user"]');
    await field.setValue('u');
    await vi.advanceTimersByTimeAsync(200);
    await field.setValue('user_02');
    await vi.advanceTimersByTimeAsync(299);
    expect(wrapper.emitted('update')).toBeUndefined();
    await vi.advanceTimersByTimeAsync(1);
    expect(wrapper.emitted('update')).toEqual([[{ user: 'user_02' }]]);
    await wrapper.get('input[name="problem"]').setValue('duongdi');
    expect(vi.getTimerCount()).toBe(1);
    wrapper.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('emits reset', async () => {
    const wrapper = mountRail();
    await wrapper.get('button[data-testid="filters-reset"]').trigger('click');
    expect(wrapper.emitted('reset')).toHaveLength(1);
  });

  it('gives each checkbox row a 44 px target with a visible code and name', () => {
    const wrapper = mountRail();
    const rows = wrapper.findAll('fieldset label');
    expect(rows).toHaveLength(6);
    for (const row of rows) expect(row.classes()).toContain('min-h-11');
    const accepted = wrapper.get('input[value="AC"]').element.closest('label')!;
    expect(accepted.textContent).toContain('AC');
    expect(accepted.textContent).toContain('Chấp nhận');
  });

  it('emits the chosen language as a one-element list and an empty list for "any"', () => {
    const wrapper = mountRail();
    const [first] = problemMeta().languages;
    wrapper.getComponent({ name: 'Select' }).vm.$emit('update:modelValue', first!.id);
    wrapper.getComponent({ name: 'Select' }).vm.$emit('update:modelValue', '');
    expect(wrapper.emitted('update')).toEqual([
      [{ languageIds: [first!.id] }],
      [{ languageIds: [] }],
    ]);
  });
});
