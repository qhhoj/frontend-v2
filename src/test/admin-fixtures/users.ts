import type { StaffUser } from '../../api/types/users-admin';

export const staffUser = (overrides: Partial<StaffUser> = {}): StaffUser => ({
  id: '0192a000-0000-7000-8000-00000000c101',
  username: 'tuan_k',
  displayName: 'tuan_k',
  displayRank: 'user',
  isActive: true,
  isStaff: false,
  isSuperuser: false,
  banReason: null,
  dateJoined: '2025-03-02T08:00:00.000Z',
  lastAccess: '2026-10-08T07:00:00.000Z',
  ...overrides,
});
