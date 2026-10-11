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
  it('shows "Bài tập" to members and both new tabs to administrators', () => {
    expect(labelsFor(MEMBER_STATE)).toContain('Bài tập');
    expect(labelsFor(MEMBER_STATE)).not.toContain('Hạn mức');
    expect(labelsFor(ADMIN_STATE)).toEqual(
      expect.arrayContaining(['Bài tập', 'Yêu cầu tham gia', 'Hạn mức']),
    );
  });

  it('shows "Kỳ thi" to everyone, after Bài tập for members and after Thành viên for the rest', () => {
    for (const viewer of [ADMIN_STATE, MEMBER_STATE, STRANGER_STATE, null])
      expect(labelsFor(viewer)).toContain('Kỳ thi');
    const order = (viewer: typeof ADMIN_STATE | null) => labelsFor(viewer);
    expect(order(MEMBER_STATE).indexOf('Kỳ thi')).toBe(order(MEMBER_STATE).indexOf('Bài tập') + 1);
    expect(order(null).indexOf('Kỳ thi')).toBe(order(null).indexOf('Thành viên') + 1);
  });

  it('shows neither to a stranger or an anonymous visitor', () => {
    for (const viewer of [STRANGER_STATE, null]) {
      expect(labelsFor(viewer)).not.toContain('Bài tập');
      expect(labelsFor(viewer)).not.toContain('Hạn mức');
    }
  });

  it('links each tab to its route with the slug', () => {
    const hrefs = linksFor(ADMIN_STATE).map((link) => link.attributes('href'));
    expect(hrefs).toEqual(
      expect.arrayContaining(['/organizations/lhp/problems',
        '/organizations/lhp/contests',
        '/organizations/lhp/quota']),
    );
  });
});
