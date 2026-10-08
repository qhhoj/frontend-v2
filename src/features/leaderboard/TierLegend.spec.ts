import { describe, expect, it } from 'vitest';
import { mountComponent } from '@/test/mount';
import TierLegend from './TierLegend.vue';

/** Each label with the swatch class of its own tier, highest tier first. */
const LEGEND = [
  ['Legendary Grandmaster ≥ 2900', 'bg-tier-grandmaster'],
  ['International Grandmaster ≥ 2600', 'bg-tier-grandmaster'],
  ['Grandmaster ≥ 2400', 'bg-tier-grandmaster'],
  ['International Master ≥ 2300', 'bg-tier-master'],
  ['Master ≥ 2200', 'bg-tier-master'],
  ['Candidate Master ≥ 1900', 'bg-tier-candidate-master'],
  ['Expert ≥ 1600', 'bg-tier-expert'],
  ['Specialist ≥ 1400', 'bg-tier-specialist'],
  ['Pupil ≥ 1200', 'bg-tier-pupil'],
  ['Newbie < 1200', 'bg-tier-newbie'],
] as const;

describe('tier legend', () => {
  it('pairs each tier label with the swatch of that tier, highest first', () => {
    const pairs = mountComponent(TierLegend)
      .findAll('li')
      .map((item) => [
        item.text(),
        item
          .get('span[aria-hidden="true"]')
          .classes()
          .find((name) => name.startsWith('bg-tier-')),
      ]);
    expect(pairs).toEqual(LEGEND);
  });

  it('keeps the swatches out of the text', () => {
    const items = mountComponent(TierLegend).findAll('li');
    expect(items.every((item) => item.get('span[aria-hidden="true"]').text() === '')).toBe(true);
  });
});
