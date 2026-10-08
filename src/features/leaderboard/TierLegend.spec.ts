import { describe, expect, it } from 'vitest';
import { mountComponent } from '@/test/mount';
import TierLegend from './TierLegend.vue';

describe('tier legend', () => {
  it('lists the tiers from the highest down, each with the rating that starts it', () => {
    const items = mountComponent(TierLegend).findAll('li');
    expect(items[0]!.text()).toBe('Legendary Grandmaster ≥ 2900');
    expect(items.at(-1)!.text()).toBe('Newbie < 1200');
    expect(items.map((item) => item.text())).toContain('Specialist ≥ 1400');
  });

  it('colours each swatch with its tier colour and keeps it out of the text', () => {
    const swatches = mountComponent(TierLegend).findAll('li > span[aria-hidden="true"]');
    expect(swatches.some((swatch) => swatch.classes().includes('bg-tier-expert'))).toBe(true);
    expect(swatches.every((swatch) => swatch.text() === '')).toBe(true);
  });
});
