import { describe, expect, it } from 'vitest';
import { organizationDetail } from '@/test/community-fixtures';
import { ADMIN_STATE, MEMBER_STATE, STRANGER_STATE } from '@/test/f4-routes';
import { mountComponent } from '@/test/mount';
import OrganizationTabsNav from './OrganizationTabsNav.vue';

const linksFor = (viewer: typeof ADMIN_STATE | null) =>
  mountComponent(OrganizationTabsNav, {
    props: { organization: organizationDetail({ viewer }) },
  }).findAll('a');
const labelsFor = (viewer: typeof ADMIN_STATE | null) =>
  linksFor(viewer).map((link) => link.text().replace(/\s+\d[\d.,]*$/, ''));

describe('organization tabs', () => {
  it('shows "Bài tập" and "Bài nộp" to members, and "Hạn mức" and "Quản lý" to administrators', () => {
    expect(labelsFor(MEMBER_STATE)).toEqual(expect.arrayContaining(['Bài tập', 'Bài nộp']));
    expect(labelsFor(MEMBER_STATE)).not.toContain('Quản lý');
    expect(labelsFor(ADMIN_STATE)).toEqual(
      expect.arrayContaining(['Bài tập', 'Bài nộp', 'Hạn mức', 'Quản lý']),
    );
  });

  it('shows neither to a stranger or an anonymous visitor', () => {
    for (const viewer of [STRANGER_STATE, null]) {
      expect(labelsFor(viewer)).not.toContain('Bài tập');
      expect(labelsFor(viewer)).not.toContain('Bài nộp');
      expect(labelsFor(viewer)).not.toContain('Hạn mức');
    }
  });
});
