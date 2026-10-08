import type { OrganizationDetail } from '@/api/types/organizations';

export type MembershipState =
  'signedOut' | 'administrator' | 'member' | 'pending' | 'canJoin' | 'canRequest';

/** The one membership panel to show (board OrgStates). */
export function membershipState(
  organization: OrganizationDetail,
  isSignedIn: boolean,
): MembershipState {
  const viewer = organization.viewer;
  if (!isSignedIn || !viewer) return 'signedOut';
  if (viewer.canAdminister) return 'administrator';
  if (viewer.isMember) return 'member';
  if (viewer.pendingRequestId) return 'pending';
  return organization.isOpen ? 'canJoin' : 'canRequest';
}
