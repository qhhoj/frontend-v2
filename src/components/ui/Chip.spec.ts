import { describe, expect, it } from 'vitest';
import { mountComponent } from '@/test/mount';
import Chip from './Chip.vue';

describe('Chip', () => {
  it('is a plain span unless interactive, then a real button', () => {
    expect(mountComponent(Chip, { slots: { default: 'Mới' } }).element.tagName).toBe('SPAN');
    const button = mountComponent(Chip, {
      props: { interactive: true },
      slots: { default: 'Lọc' },
    });
    expect(button.element.tagName).toBe('BUTTON');
    expect(button.attributes('type')).toBe('button');
  });

  it('is a toggle with aria-pressed, a pressed chip takes the accent look', () => {
    const off = mountComponent(Chip, { props: { pressed: false, tone: 'danger' } });
    expect(off.element.tagName).toBe('BUTTON');
    expect(off.attributes('aria-pressed')).toBe('false');
    expect(off.classes()).toContain('text-negative');
    const on = mountComponent(Chip, { props: { pressed: true, tone: 'danger' } });
    expect(on.attributes('aria-pressed')).toBe('true');
    expect(on.classes()).toContain('border-accent');
    expect(on.classes()).not.toContain('text-negative');
  });

  it('emits remove from the x button, which is named by removeLabel', async () => {
    const chip = mountComponent(Chip, {
      props: { removable: true, removeLabel: 'Bỏ lọc Dễ' },
      slots: { default: 'Dễ' },
    });
    await chip.get('button[aria-label="Bỏ lọc Dễ"]').trigger('click');
    expect(chip.emitted('remove')).toHaveLength(1);
  });

  it('colours a verdict code with that verdict and a tag with its tag pair', () => {
    expect(mountComponent(Chip, { props: { tone: 'TLE' } }).classes()).toContain(
      'text-verdict-tle',
    );
    expect(mountComponent(Chip, { props: { tone: 'MLE' } }).classes()).toContain(
      'text-verdict-tle',
    );
    expect(mountComponent(Chip, { props: { tone: 'tag-3' } }).classes()).toContain('bg-tag-3-bg');
  });
});
