import { describe, expect, it } from 'vitest';
import { mockApi, page } from '@/test/mock-api';
import { joinRequest } from '@/test/community-fixtures';
import { fetchOrganizations } from './organizations.api';
import { fetchAllJoinRequests } from './organizations-admin.api';

describe('organization admin API', () => {
  it('sends a trimmed search to the list and leaves it out when blank', async () => {
    const calls = mockApi({ 'GET /organizations': page([]) });
    await fetchOrganizations(1, '  lê hồng ');
    await fetchOrganizations(1, '   ');
    await fetchOrganizations(1);
    expect(calls.map((call) => call.query.get('search'))).toEqual(['lê hồng', null, null]);
  });

  it('reads the queue across organizations by state and page, each row naming its organization', async () => {
    const calls = mockApi({
      'GET /admin/organization-requests': page([joinRequest({ organizationSlug: 'lhp' })]),
    });
    const result = await fetchAllJoinRequests('A', 2);
    expect([calls[0]!.query.get('state'), calls[0]!.query.get('page')]).toEqual(['A', '2']);
    expect(result.items[0]!.organizationSlug).toBe('lhp');
  });
});
