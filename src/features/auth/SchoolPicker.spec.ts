import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { organizationItem } from '@/test/fixtures';
import { mountComponent } from '@/test/mount';
import { openSelect } from '@/test/select';
import SchoolPicker from './SchoolPicker.vue';

const mountPicker = (props: Record<string, unknown> = {}) =>
  mountComponent(SchoolPicker, {
    props: { schools: [organizationItem()], modelValue: '', ...props },
  });
const COMBOBOX = '[role="combobox"]';

describe('SchoolPicker', () => {
  it('marks the label "(tuỳ chọn)" by default and not for a required picker', () => {
    expect(mountPicker().get('[data-testid="school-picker"] > span').text()).toBe(
      'Trường (tuỳ chọn)',
    );
    expect(
      mountPicker({ optional: false }).get('[data-testid="school-picker"] > span').text(),
    ).toBe('Trường');
  });

  it('draws no PrimeVue magnifier in the filter', async () => {
    const wrapper = mountPicker();
    await openSelect(wrapper, '[data-testid="school-picker"]');
    const filter = document.body.querySelector<HTMLInputElement>('input[role="searchbox"]');
    expect(filter).not.toBeNull();
    expect(filter!.parentElement!.querySelectorAll('svg')).toHaveLength(0);
  });

  it('names the filter for assistive technology', async () => {
    const wrapper = mountPicker();
    await openSelect(wrapper, '[data-testid="school-picker"]');
    const filter = document.body.querySelector<HTMLInputElement>('input[role="searchbox"]');
    expect(filter?.getAttribute('aria-label')).toBe('Tìm trường');
  });

  it('shows the empty choice as the muted placeholder, not as a chosen school', async () => {
    const wrapper = mountPicker();
    await flushPromises();
    const label = wrapper.get(`[data-testid="school-picker"] ${COMBOBOX}`);
    expect(label.attributes('data-p')).toContain('placeholder');
  });
});
