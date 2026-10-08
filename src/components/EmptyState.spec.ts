import { describe, expect, it } from 'vitest';
import { mountComponent } from '@/test/mount';
import EmptyState from './EmptyState.vue';

describe('EmptyState (compact)', () => {
  it('shows the sleeping Bit by default, decoratively, beside its message', () => {
    const wrapper = mountComponent(EmptyState, {
      props: { compact: true },
      slots: { default: 'Chưa có gì.' },
    });
    expect(wrapper.text()).toBe('Chưa có gì.');
    const bit = wrapper.get('[data-testid="inline-bit"]');
    expect(bit.attributes('aria-hidden')).toBe('true');
    expect(bit.attributes('data-frame')).toBeUndefined(); // a still mood
  });

  it('shows the Bit kind it is given', () => {
    const wrapper = mountComponent(EmptyState, {
      props: { compact: true, kind: 'security' },
      slots: { default: 'Chưa có khoá nào.' },
    });
    expect(wrapper.get('[data-testid="inline-bit"]').attributes('data-frame')).toBeDefined(); // the moving padlock
  });
});
