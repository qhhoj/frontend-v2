import { describe, expect, it } from 'vitest';
import type { ContestSummary } from '@/api/types/contests';
import { contestItem } from '@/test/fixtures';
import { mountComponent } from '@/test/mount';
import ContestChips from './ContestChips.vue';

const chipsOf = (contest: ContestSummary, withTags = false, withCodeNeeded = false) =>
  mountComponent(ContestChips, { props: { contest, withTags, withCodeNeeded } })
    .findAll('span')
    .map((chip) => chip.text());

const PLAIN = { isRated: false, isPrivate: false, isOrganizationPrivate: false, tags: [] };

describe('contest chips', () => {
  it('shows the private chip, and not the organization chip, for a private contest', () => {
    const chips = chipsOf(contestItem({ ...PLAIN, isPrivate: true, isOrganizationPrivate: true }));
    expect(chips).toEqual(['ICPC', 'Riêng tư']);
  });

  it('lists the tags only when asked', () => {
    const contest = contestItem({ ...PLAIN, tags: ['dp', 'graphs'] });
    expect(chipsOf(contest)).toEqual(['ICPC']);
    expect(chipsOf(contest, true)).toEqual(['ICPC', 'dp', 'graphs']);
  });

  it('leads the tags with a link to each organization the contest is restricted to', () => {
    const wrapper = mountComponent(ContestChips, {
      props: {
        contest: contestItem({
          ...PLAIN,
          isOrganizationPrivate: true,
          tags: ['dp'],
          organizations: [
            { slug: 'hanoi_club', name: 'Hanoi Club' },
            { slug: 'saigon', name: 'Saigon' },
          ],
        }),
        withTags: true,
      },
    });
    const links = wrapper.findAll('[data-testid="contest-organization-chip"]');
    expect(links.map((link) => [link.text(), link.attributes('href')])).toEqual([
      ['Hanoi Club', '/organizations/hanoi_club'],
      ['Saigon', '/organizations/saigon'],
    ]);
    expect(wrapper.text()).toBe('ICPCHanoi ClubSaigondp');
  });

  it('keeps the plain organization chip where organizations are not listed', () => {
    const organizations = [{ slug: 'saigon', name: 'Saigon' }];
    const contest = contestItem({ ...PLAIN, isOrganizationPrivate: true, organizations });
    expect(chipsOf(contest)).toEqual(['ICPC', 'Nội bộ']);
  });
});
