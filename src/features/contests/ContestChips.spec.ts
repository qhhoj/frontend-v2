import { describe, expect, it } from 'vitest';
import type { ContestSummary } from '@/api/types/contests';
import { contestItem } from '@/test/fixtures';
import { mountComponent } from '@/test/mount';
import ContestChips from './ContestChips.vue';

const chipsOf = (contest: ContestSummary, withTags = false) =>
  mountComponent(ContestChips, { props: { contest, withTags } })
    .findAll('span')
    .map((chip) => chip.text());

const PLAIN = { isRated: false, isPrivate: false, isOrganizationPrivate: false, tags: [] };

describe('contest chips', () => {
  it('shows only the format for a public, unrated contest', () => {
    expect(chipsOf(contestItem({ ...PLAIN, formatName: 'icpc' }))).toEqual(['ICPC']);
  });

  it('adds the rating chip for a rated contest', () => {
    expect(chipsOf(contestItem({ ...PLAIN, isRated: true }))).toEqual(['ICPC', 'Tính rating']);
  });

  it('shows the private chip, and not the organization chip, for a private contest', () => {
    const chips = chipsOf(contestItem({ ...PLAIN, isPrivate: true, isOrganizationPrivate: true }));
    expect(chips).toEqual(['ICPC', 'Riêng tư']);
  });

  it('shows the organization chip for a contest limited to one organization', () => {
    expect(chipsOf(contestItem({ ...PLAIN, isOrganizationPrivate: true }))).toEqual([
      'ICPC',
      'Nội bộ',
    ]);
  });

  it('lists the tags only when asked', () => {
    const contest = contestItem({ ...PLAIN, tags: ['dp', 'graphs'] });
    expect(chipsOf(contest)).toEqual(['ICPC']);
    expect(chipsOf(contest, true)).toEqual(['ICPC', 'dp', 'graphs']);
  });
});
