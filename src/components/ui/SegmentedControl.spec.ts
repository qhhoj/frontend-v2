import { beforeEach, describe, expect, it } from 'vitest';
import { mockApi } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';
import SegmentedControl from './SegmentedControl.vue';

beforeEach(() => mockApi({ ...anonymousViewer }));

const MODES = [
  { value: 'light', label: 'Sáng' },
  { value: 'dark', label: 'Tối' },
];

describe('SegmentedControl', () => {
  it('is a named group of toggles, the model one pressed, and a click emits its value', async () => {
    const wrapper = mountComponent(SegmentedControl, {
      props: { label: 'Chế độ', options: MODES, modelValue: 'light' },
    });
    const group = wrapper.get('[role="group"]');
    expect(group.attributes('aria-label')).toBe('Chế độ');
    const buttons = group.findAll('button');
    expect(buttons.map((button) => button.attributes('aria-pressed'))).toEqual(['true', 'false']);
    await buttons[1]!.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([['dark']]);
  });

  it('disables every toggle when disabled', () => {
    const wrapper = mountComponent(SegmentedControl, {
      props: { label: 'Chế độ', options: MODES, modelValue: null, disabled: true },
    });
    expect(wrapper.findAll('button').every((button) => button.element.disabled)).toBe(true);
  });

  it('is a nav of links when the options carry routes, hides a zero count and reads alerts', async () => {
    const wrapper = mountComponent(SegmentedControl, {
      props: {
        label: 'Chế độ xem',
        size: 'sm',
        modelValue: 'advanced',
        options: [
          { value: 'basic', label: 'Cơ bản', to: '/problems?view=basic', count: 0 },
          {
            value: 'advanced',
            label: 'Nâng cao',
            to: '/problems?view=advanced',
            count: 2,
            countTestid: 'advanced-count',
            alertLabel: 'Có lỗi',
            testid: 'advanced',
          },
        ],
      },
    });
    await wrapper.vm.$router.push('/problems');
    const nav = wrapper.get('nav');
    expect(nav.attributes('aria-label')).toBe('Chế độ xem');
    expect(nav.get('[aria-current="page"]').attributes('href')).toBe('/problems?view=advanced');
    expect(nav.findAll('a')[0]!.find('.font-mono').exists()).toBe(false);
    expect(wrapper.get('[data-testid="advanced-count"]').text()).toBe('2');
    expect(wrapper.get('[data-testid="advanced-alert"]').text()).toBe('Có lỗi');
  });
});
