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
