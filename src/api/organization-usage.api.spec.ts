import { describe, expect, it } from 'vitest';
import { mockApi, ok, page } from '@/test/mock-api';
import { organizationUsage, usageRow } from '@/test/f4-fixtures';
import {
  USAGE_PAGE_SIZE,
  fetchOrganizationUsage,
  fetchUsageOverview,
  updateOrganizationQuota,
} from './organization-usage.api';

describe('organization usage api', () => {
  it('reads one organization’s usage', async () => {
    mockApi({ 'GET /organizations/lhp/usage': ok(organizationUsage()) });
    expect((await fetchOrganizationUsage('lhp')).month).toBe('2026-10');
  });

  it('reads the staff overview sorted and paged', async () => {
    const calls = mockApi({ 'GET /organizations/usage': page([usageRow()]) });
    await fetchUsageOverview('credits', 2);
    const query = calls[0]!.query;
    expect([query.get('sort'), query.get('page'), query.get('pageSize')]).toEqual([
      'credits',
      '2',
      String(USAGE_PAGE_SIZE),
    ]);
  });

  it('PATCHes the quota with null meaning the site default', async () => {
    const calls = mockApi({ 'PATCH /organizations/lhp/quota': ok(organizationUsage()) });
    await updateOrganizationQuota('lhp', { quotaMonthlyCredits: 300, quotaStorageBytes: null });
    expect(calls[0]!.body).toEqual({ quotaMonthlyCredits: 300, quotaStorageBytes: null });
  });
});
