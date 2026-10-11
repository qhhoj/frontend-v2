import type {
  PermissionCategory,
  PermissionEntry,
  Role,
  UserAccess,
  UserAccessChange,
} from '@/api/types/users-admin';

/** The access form: role ids, direct codenames and the two flags. */
export interface AccessForm {
  groups: string[];
  permissions: string[];
  isStaff: boolean;
  isSuperuser: boolean;
}

export const accessFormOf = (access: UserAccess): AccessForm => ({
  groups: access.groups.map((role) => role.id),
  permissions: [...access.permissions],
  isStaff: access.isStaff,
  isSuperuser: access.isSuperuser,
});

/** Items of `next` missing from `current`, and of `current` missing from `next`. Pure. */
export const setDelta = (current: readonly string[], next: readonly string[]) => ({
  add: next.filter((item) => !current.includes(item)),
  remove: current.filter((item) => !next.includes(item)),
});

/** What the form changes, as the add/remove body the backend applies on top of the stored access (so a role granted meanwhile stays). Pure. */
export function accessChangeOf(access: UserAccess, form: AccessForm): UserAccessChange {
  const before = accessFormOf(access);
  const groups = setDelta(before.groups, form.groups);
  const permissions = setDelta(before.permissions, form.permissions);
  const body: UserAccessChange = {};
  if (groups.add.length) body.addGroups = groups.add;
  if (groups.remove.length) body.removeGroups = groups.remove;
  if (permissions.add.length) body.addPermissions = permissions.add;
  if (permissions.remove.length) body.removePermissions = permissions.remove;
  if (form.isStaff !== before.isStaff) body.isStaff = form.isStaff;
  if (form.isSuperuser !== before.isSuperuser) body.isSuperuser = form.isSuperuser;
  return body;
}

/** For each codename, the names of the chosen roles granting it. Pure. */
export function inheritedFrom(
  roles: readonly Role[],
  chosen: readonly string[],
): Map<string, string[]> {
  const via = new Map<string, string[]>();
  for (const role of roles.filter((item) => chosen.includes(item.id)))
    for (const code of role.permissions) via.set(code, [...(via.get(code) ?? []), role.name]);
  return via;
}

/** Catalog row, or a held legacy codename the catalog no longer lists (category `other`). */
export interface ChecklistItem {
  codename: string;
  label: string;
  category: PermissionCategory | 'other';
}

/** The catalog plus held legacy codenames, filtered by `search` (label or codename, case-insensitive) and grouped by category in catalog order. Pure. */
export function checklistGroups(
  catalog: readonly PermissionEntry[],
  held: readonly string[],
  search: string,
  labelOf: (entry: { codename: string; label: string }) => string,
): { category: ChecklistItem['category']; items: ChecklistItem[] }[] {
  const known = new Set(catalog.map((entry) => entry.codename));
  const items: ChecklistItem[] = [
    ...catalog.map((entry) => ({ ...entry, label: labelOf(entry) })),
    ...[...new Set(held)]
      .filter((code) => !known.has(code))
      .map((codename) => ({ codename, label: codename, category: 'other' as const })),
  ];
  const needle = search.trim().toLowerCase();
  const shown = needle
    ? items.filter(
        (item) =>
          item.label.toLowerCase().includes(needle) || item.codename.toLowerCase().includes(needle),
      )
    : items;
  const groups = new Map<ChecklistItem['category'], ChecklistItem[]>();
  for (const item of shown) groups.set(item.category, [...(groups.get(item.category) ?? []), item]);
  return [...groups].map(([category, grouped]) => ({ category, items: grouped }));
}
