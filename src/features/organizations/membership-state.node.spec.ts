import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { organizationDetail } from '@/test/community-fixtures';
import { membershipErrorCopy } from './membership-errors';
import { membershipState } from './membership-state';

const viewer = (
  isMember: boolean,
  canAdminister: boolean,
  pendingRequestId: string | null = null,
) => ({ isMember, canAdminister, pendingRequestId });

describe('membershipState', () => {
  it('picks the one panel the board draws for each viewer', () => {
    expect(membershipState(organizationDetail({ viewer: null }), false)).toBe('signedOut');
    expect(membershipState(organizationDetail({ viewer: viewer(true, true) }), true)).toBe(
      'administrator',
    );
    expect(membershipState(organizationDetail({ viewer: viewer(true, false) }), true)).toBe(
      'member',
    );
    expect(
      membershipState(
        organizationDetail({ isOpen: false, viewer: viewer(false, false, 'r-1') }),
        true,
      ),
    ).toBe('pending');
    expect(
      membershipState(organizationDetail({ isOpen: true, viewer: viewer(false, false) }), true),
    ).toBe('canJoin');
    expect(
      membershipState(organizationDetail({ isOpen: false, viewer: viewer(false, false) }), true),
    ).toBe('canRequest');
  });
  it('lets membership outrank a stale pending id, so the pending card never hides a member', () => {
    expect(membershipState(organizationDetail({ viewer: viewer(true, false, 'r-1') }), true)).toBe(
      'member',
    );
  });
  it('treats an editor of every organization who is not an admin of this one like an administrator', () => {
    expect(membershipState(organizationDetail({ viewer: viewer(false, true) }), true)).toBe(
      'administrator',
    );
  });
});

describe('membershipErrorCopy', () => {
  const conflict = new ApiError('conflict', 409, 'x');
  it('uses the board’s two cards for a refused join and a full organization', () => {
    expect(membershipErrorCopy('join', conflict).title).toBe('orgMembership.joinFailedTitle');
    expect(membershipErrorCopy('approve', conflict).title).toBe('orgMembership.fullTitle');
  });
  it('says to retry for the busy lock, whichever action it hit', () => {
    const busy = new ApiError('conflict', 409, 'x', {
      issues: [{ field: 'lock', code: 'busy', message: 'x' }],
    });
    for (const action of ['join', 'approve', 'reject'] as const) {
      expect(membershipErrorCopy(action, busy)).toEqual({
        title: 'orgMembership.failedTitle',
        body: 'admin.ui.issues.busy',
      });
    }
  });
});
