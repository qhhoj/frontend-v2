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

  it('leaves the empty option out when there is no placeholder', async () => {
    const wrapper = mountSelect({ placeholder: undefined, modelValue: 'cpp' });
    await flushPromises();
    expect(wrapper.findAll('option').map((option) => option.text())).toEqual(['C++17']);
  });

  it('shows the placeholder as the empty option when given', async () => {
    const wrapper = mountSelect();
    await flushPromises();
    expect(wrapper.findAll('option').map((option) => option.text())).toEqual([
      'Chưa chọn',
      'C++17',
    ]);
  });

  it('links the error and the hint to the select', async () => {
    const wrapper = mountSelect({ hint: 'Chọn sẵn ở trang nộp bài.', error: 'Không hợp lệ.' });
    await flushPromises();
    const described = wrapper
      .get('select')
      .attributes('aria-describedby')!
      .split(' ')
      .map((id) => wrapper.get(`[id="${id}"]`).text());
    expect(described).toEqual(['Không hợp lệ.', 'Chọn sẵn ở trang nộp bài.']);
  });
});
