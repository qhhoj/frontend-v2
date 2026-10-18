import { describe, expect, it } from 'vitest';
import { mountComponent } from '@/test/mount';
import Switch from './Switch.vue';

describe('Switch', () => {
  it('is a switch named by its label that flips its model on click', async () => {
    const wrapper = mountComponent(Switch, { props: { modelValue: false, label: 'Hiển thị' } });
    const control = wrapper.get('[role="switch"]');
    expect(control.attributes('aria-checked')).toBe('false');
    expect(wrapper.get(`#${control.attributes('aria-labelledby')}`).text()).toBe('Hiển thị');
    await control.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]]);
  });

  it('takes its name from a title elsewhere on the page', () => {
    const wrapper = mountComponent(Switch, { props: { modelValue: true, labelledby: 'look' } });
    expect(wrapper.get('[role="switch"]').attributes('aria-labelledby')).toBe('look');
  });

  it('when disabled, says why and never flips', async () => {
    const wrapper = mountComponent(Switch, {
      props: { modelValue: true, label: 'Hiển thị', disabled: true },
      slots: { note: 'Cần quyền' },
    });
    const control = wrapper.get('[role="switch"]');
    expect(control.attributes('aria-disabled')).toBe('true');
    expect(wrapper.get(`#${control.attributes('aria-describedby')}`).text()).toBe('Cần quyền');
    await control.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });
});
