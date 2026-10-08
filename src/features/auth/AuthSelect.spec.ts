import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { mountComponent } from '@/test/mount';
import AuthSelect from './AuthSelect.vue';

const mountSelect = (props: Record<string, unknown> = {}) =>
  mountComponent(AuthSelect, {
    props: {
      label: 'Ngôn ngữ',
      name: 'languageId',
      placeholder: 'Chưa chọn',
      modelValue: '',
      ...props,
    },
    slots: { default: '<option value="cpp">C++17</option>' },
  });

describe('AuthSelect', () => {
  it('marks the label "(tuỳ chọn)" by default', async () => {
    const wrapper = mountSelect();
    await flushPromises();
    expect(wrapper.get('label').text()).toBe('Ngôn ngữ (tuỳ chọn)');
  });

  it('leaves "(tuỳ chọn)" off a required select', async () => {
    const wrapper = mountSelect({ optional: false });
    await flushPromises();
    expect(wrapper.get('label').text()).toBe('Ngôn ngữ');
  });
});
