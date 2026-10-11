import type { Schemas } from '@/api/schemas';
import { allowsAny } from '@/lib/permissions';
import type { PermissionHolder, PermissionRule } from '@/lib/permissions';
import { ADMIN_SCREENS } from './admin-screens';
import type { AdminCapability } from './admin-screens';

export type { AdminCapability };

/** What the admin checks read; a `SessionUser` is one. */
export interface AdminViewer extends PermissionHolder {
  isStaff?: boolean;
  /** Absent while the backend predates the field: no object rights. */
  adminCapabilities?: Partial<Schemas['AdminCapabilitiesResponse']>;
}

/** A yes/no right, or a creation scope that opens the screen when it reaches anywhere (site-wide or an organization). */
const isGranted = (value: boolean | Schemas['CreationScopeResponse'] | undefined): boolean =>
  typeof value === 'object' ? value.site || value.organizations : value === true;

/** What opens an admin screen: any permission of the rule, or the object right (the server still checks each object). */
export interface AdminAccess {
  /** `null`: anyone who may enter `/admin`. */
  permission: PermissionRule | null;
  capability?: AdminCapability;
}

const holds = (user: AdminViewer | null, capability: AdminCapability | undefined) =>
  capability !== undefined && isGranted(user?.adminCapabilities?.[capability]);

export const canUseAdmin = (user: AdminViewer | null, access: AdminAccess): boolean =>
  allowsAny(user, access.permission) || holds(user, access.capability);

/** Every rule that opens something in `/admin` besides the dashboard. */
const ENTRY_RULES: AdminAccess[] = Object.values(ADMIN_SCREENS).filter(
  (screen) => screen.permission !== null,
);

/**
 * Who sees `/admin` at all: whoever can use at least one admin screen (an authoring or moderation permission, or
 * an organization to administer). Staff keep the dashboard even without one. The staff flag is not required.
 */
export const canEnterAdmin = (user: AdminViewer | null): boolean =>
  user !== null && (user.isStaff === true || ENTRY_RULES.some((rule) => canUseAdmin(user, rule)));
