import { describe, expect, it } from 'vitest';
import { mountComponent } from '@/test/mount';
import AuditFilters from './AuditFilters.vue';
import type { AuditFilter } from './audit';

const mountFilters = (patch: Partial<AuditFilter> = {}) =>
  mountComponent(AuditFilters, {
    props: { filter: { actor: '', type: '', from: '', to: '', ...patch } },
  });
const [, fromBox, toBox] = [0, 1, 2];

describe('AuditFilters day range', () => {
  it('shows the days as dd/mm/yyyy, with the zone, instead of a native mm/dd/yyyy picker', () => {
    const wrapper = mountFilters({ from: '2026-10-01', to: '2026-10-17' });
    const boxes = wrapper.findAll('input');
    expect(boxes.some((box) => box.attributes('type') === 'date')).toBe(false);
    expect(boxes[fromBox]!.element.value).toBe('01/10/2026');
    expect(boxes[toBox]!.element.value).toBe('17/10/2026');
    expect(wrapper.text()).toContain('GMT');
  });

  it('puts a typed day into the filter as YYYY-MM-DD and keeps the other fields', async () => {
    const wrapper = mountFilters({ actor: 'bitcoder', to: '2026-10-17' });
    await wrapper.findAll('input')[fromBox]!.setValue('8/10/2026');
    expect(wrapper.emitted('change')!.at(-1)).toEqual([
      { actor: 'bitcoder', type: '', from: '2026-10-08', to: '2026-10-17' },
    ]);
  });

  it('drops the day when the box is emptied', async () => {
    const wrapper = mountFilters({ from: '2026-10-01' });
    await wrapper.findAll('input')[fromBox]!.setValue('');
    expect(wrapper.emitted('change')!.at(-1)).toEqual([{ actor: '', type: '', from: '', to: '' }]);
  });

  it('refuses a time of day in a day box and says how to write it', async () => {
    const wrapper = mountFilters();
    const box = wrapper.findAll('input')[fromBox]!;
    await box.setValue('08/10/2026 13:00');
    await box.trigger('blur');
    expect(wrapper.emitted('change')).toBeUndefined();
    expect(box.attributes('aria-invalid')).toBe('true');
  });

  it('flags a range that ends before it starts', () => {
    const wrapper = mountFilters({ from: '2026-10-17', to: '2026-10-01' });
    expect(wrapper.findAll('input')[toBox]!.attributes('aria-invalid')).toBe('true');
    expect(mountFilters({ from: '2026-10-01', to: '2026-10-17' }).text()).not.toContain('sau ngày');
  });
});
