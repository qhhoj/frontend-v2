import { describe, expect, it } from 'vitest';
import { organizationDetail } from '@/test/community-fixtures';
import { slotsLine } from './organization-facts';

describe('organization facts', () => {
  it('says how many places are left, never a negative number, or that there is no cap', () => {
    expect(slotsLine(organizationDetail({ slots: 60, memberCount: 48 }))).toEqual({
      key: 'orgs.slotsLeft',
      params: { free: 12, slots: 60 },
    });
    expect(slotsLine(organizationDetail({ slots: 40, memberCount: 48 })).params).toEqual({
      free: 0,
      slots: 40,
    });
    expect(slotsLine(organizationDetail({ slots: null }))).toEqual({ key: 'orgs.slotsUnlimited' });
  });
});
