/** backend: apps/api/src/modules/users/admin/dto/staff-user.response.ts (StaffUserResponse) */
export interface StaffUser {
  id: string;
  username: string;
  displayName: string;
  displayRank: string;
  isActive: boolean;
  isStaff: boolean;
  isSuperuser: boolean;
  /** Null unless banned. */
  banReason: string | null;
  dateJoined: string;
  /** Null: never signed in. */
  lastAccess: string | null;
}

/** backend: user-admin.dto.ts (UserAdminQueryDto); `banned` true is banned only, false is not banned only, unset is everyone. */
export interface StaffUserQuery {
  search?: string;
  banned?: boolean;
  /** `lastAccess` oldest first (never-seen users lead), `-lastAccess` newest first; unset is the server's order. */
  sort?: 'lastAccess' | '-lastAccess';
  page: number;
}
