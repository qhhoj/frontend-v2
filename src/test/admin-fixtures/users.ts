import type { StaffUser } from '../../api/types/users-admin';

export const staffUser = (overrides: Partial<StaffUser> = {}): StaffUser => ({
  id: '0192a000-0000-7000-8000-00000000c101',
  username: 'tuan_k',
  rating: null,
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

/** `count` distinct users `user_01…`, for list and pager specs. */
export const staffUsers = (count: number): StaffUser[] =>
  Array.from({ length: count }, (_unused, index) => {
    const name = `user_${String(index + 1).padStart(2, '0')}`;
    return staffUser({
      id: `0192a000-0000-7000-8000-00000000d${String(index).padStart(3, '0')}`,
      username: name,
      displayName: name,
    });
  });
