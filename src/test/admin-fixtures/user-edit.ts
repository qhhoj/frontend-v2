import type { UserEdit } from '../../api/types/users-admin';
import { ok } from '../mock-api';

/** The staff edit view of one account (`GET /admin/users/:username/profile`). */
export const userEdit = (overrides: Partial<UserEdit> = {}): UserEdit => ({
  id: '01900000-0000-7000-8000-0000000000aa',
  username: 'tuan_k',
  displayName: '',
  fullName: 'Tuấn Khang',
  about: 'Học sinh chuyên Tin.',
  email: 'tuan_k@example.com',
  displayRank: 'user',
  isUnlisted: false,
  mute: false,
  allowTagging: true,
  notes: '',
  inContest: false,
  hasTwoFactor: false,
  socialProviders: [],
  isActive: true,
  isStaff: false,
  isSuperuser: false,
  banReason: null,
  dateJoined: '2024-09-01T00:00:00.000Z',
  lastLogin: '2026-10-01T00:00:00.000Z',
  organizations: [
    {
      id: '01900000-0000-7000-8000-0000000000b1',
      slug: 'thpt-qh',
      name: 'THPT Quốc Học',
      shortName: 'QH',
      isOpen: false,
    },
  ],
  socialProviders: [],
  ...overrides,
});

/** The access section's reads for a user with no roles or permissions, viewed read-only. */
export const emptyAccessRoutes = (username: string) => ({
  'GET /admin/permissions': ok([]),
  'GET /admin/groups': ok([]),
  [`GET /admin/users/${username}/access`]: ok({
    isStaff: false,
    isSuperuser: false,
    groups: [],
    permissions: [],
    effective: [],
    canEdit: false,
  }),
});
