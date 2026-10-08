import { describe, expect, it } from 'vitest';
import { organizationItem } from '@/test/fixtures';
import { mockApi, page } from '@/test/mock-api';
import { fetchOpenOrganizations } from './organizations.api';

describe('fetchOpenOrganizations', () => {
  it('keeps the organizations a signup may join: open and listed', async () => {
    mockApi({
      'GET /organizations': page([
        organizationItem({ slug: 'open', name: 'Open' }),
        organizationItem({ slug: 'closed', name: 'Closed', isOpen: false }),
        organizationItem({ slug: 'hidden', name: 'Hidden', isUnlisted: true }),
      ]),
    });
    expect((await fetchOpenOrganizations()).map((organization) => organization.slug)).toEqual([
      'open',
    ]);
  });

  it('reads every page the backend has, at the largest page size, in its order', async () => {
    const calls = mockApi({
      'GET /organizations': (call) => {
        const pageNumber = Number(call.query.get('page'));
        return page([organizationItem({ slug: `school-${pageNumber}` })], {
          page: pageNumber,
          pageSize: 100,
          total: 150,
        });
      },
    });
    const schools = await fetchOpenOrganizations();
    expect(schools.map((organization) => organization.slug)).toEqual(['school-1', 'school-2']);
    expect(calls.map((call) => [call.query.get('page'), call.query.get('pageSize')])).toEqual([
      ['1', '100'],
      ['2', '100'],
    ]);
  });
});
