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

  it('keeps the remove button beside an interactive chip, never inside it, and its click is not the chip action', async () => {
    const chip = mountComponent(Chip, {
      props: { removable: true, removeLabel: 'Bỏ lọc Dễ', pressed: true },
      slots: { default: 'Dễ' },
    });
    expect(chip.attributes('role')).toBe('group');
    expect(chip.find('button button').exists()).toBe(false);
    const [own, remove] = chip.findAll('button');
    expect(own!.attributes('aria-pressed')).toBe('true');
    expect(own!.text()).toBe('Dễ');
    await remove!.trigger('click');
    expect(chip.emitted('remove')).toHaveLength(1);
    expect(chip.emitted('click')).toBeUndefined();
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
