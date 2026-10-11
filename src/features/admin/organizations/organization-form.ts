import type { OrganizationBody } from '@/api/organizations-admin.api';
import type { UserChip } from '@/api/types/admin-common';
import type { OrganizationDetail } from '@/api/types/organizations';
import { translate } from '@/i18n';
import type { FieldErrors } from '../ui/admin-errors';

export const ORGANIZATION_SLUG_PATTERN = /^[A-Za-z][\w-]{0,127}$/;
const LOGO_PATTERN = /^(|https?:\/\/[^\s"'<>]+|\/[^\s"'<>]*)$/;
/** Backend `STAFF_FIELDS`: any of these in a create or an update body is a 403 without `judge.edit_all_organization`. */
const STAFF_FIELDS: readonly string[] = ['isUnlisted', 'slots', 'shortName'];
export const MAX_ORGANIZATION_ADMINS = 20;
const SHORT_NAME_MAX_LENGTH = 20;
/** Backend `slots`: a whole number from 0 to 1 000 000 (`null` is no limit). */
const SLOTS_MAX = 1_000_000;

export interface OrganizationForm {
  name: string;
  slug: string;
  shortName: string;
  about: string;
  logoOverrideImage: string;
  admins: UserChip[];
  slots: number | null;
  isOpen: boolean;
  isUnlisted: boolean;
}

export const toOrganizationForm = (detail: OrganizationDetail): OrganizationForm => ({
  name: detail.name,
  slug: detail.slug,
  shortName: detail.shortName,
  about: detail.about ?? '',
  logoOverrideImage: detail.logoOverrideImage,
  admins: detail.admins.map(({ id, username }) => ({ id, username })),
  slots: detail.slots,
  isOpen: detail.isOpen,
  isUnlisted: detail.isUnlisted,
});

/** The backend's create defaults: closed and unlisted, the short name derived from the slug. */
export const emptyOrganizationForm = (): OrganizationForm => ({
  name: '',
  slug: '',
  shortName: '',
  about: '',
  logoOverrideImage: '',
  admins: [],
  slots: null,
  isOpen: false,
  isUnlisted: true,
});

const SLUG_MAX_LENGTH = 128;
/** Backend `RESERVED_ORGANIZATION_SLUG_PATTERN`: `GET /organizations/usage` is a static route. */
const RESERVED_SLUGS = ['usage'];

/**
 * Legacy `prepopulated_fields`: an address typed for the name. Vietnamese marks are dropped (đ becomes d), every other run
 * of characters becomes one hyphen, and a name that does not start with a letter gets the `org-` prefix the pattern needs.
 */
export function slugFromName(name: string): string {
  const plain = name
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!plain) return '';
  const slug = /^[a-z]/.test(plain) ? plain : `org-${plain}`;
  const cut = slug.slice(0, SLUG_MAX_LENGTH).replace(/-+$/, '');
  return RESERVED_SLUGS.includes(cut) ? `${cut}-org` : cut;
}

/** The wire name and value of one form field: `admins` goes as the list of ids. */
const wireFieldOf = (key: keyof OrganizationForm, form: OrganizationForm): [string, unknown] =>
  key === 'admins' ? ['adminIds', form.admins.map((chip) => chip.id)] : [key, form[key]];

/** On an edit, only the fields that differ from the loaded organization; staff fields only for a viewer who may write them. */
export function changedOrganizationFields(
  before: OrganizationForm,
  after: OrganizationForm,
  canEditAll: boolean,
): Partial<OrganizationBody> {
  const patch: Record<string, unknown> = {};
  for (const key of Object.keys(after) as (keyof OrganizationForm)[]) {
    if (!canEditAll && STAFF_FIELDS.includes(key)) continue;
    if (JSON.stringify(before[key]) === JSON.stringify(after[key])) continue;
    const [name, value] = wireFieldOf(key, after);
    patch[name] = value;
  }
  return patch;
}

/** The staff fields a create may carry: `isUnlisted` always, `slots` and `shortName` only when filled. */
function staffFieldsOf(form: OrganizationForm): Partial<OrganizationBody> {
  const staff: Partial<OrganizationBody> = { isUnlisted: form.isUnlisted };
  if (form.slots !== null) staff.slots = form.slots;
  if (form.shortName.trim()) staff.shortName = form.shortName.trim();
  return staff;
}

/** The POST body: the required fields and whatever was filled; the staff fields only for a viewer who may write them. */
export function toOrganizationBody(form: OrganizationForm, canEditAll: boolean): OrganizationBody {
  const body: OrganizationBody = { name: form.name.trim(), slug: form.slug, isOpen: form.isOpen };
  if (form.about) body.about = form.about;
  if (form.logoOverrideImage) body.logoOverrideImage = form.logoOverrideImage;
  if (form.admins.length > 0) body.adminIds = form.admins.map((chip) => chip.id);
  return canEditAll ? { ...body, ...staffFieldsOf(form) } : body;
}

/** A short name is required on an edit by a staff viewer, optional on a create; when typed it is 1 to 20 characters. */
function isShortNameWrong(form: OrganizationForm, canEditAll: boolean, isCreate: boolean): boolean {
  if (!canEditAll) return false;
  const length = form.shortName.length;
  if (isCreate) return length > SHORT_NAME_MAX_LENGTH;
  return length < 1 || length > SHORT_NAME_MAX_LENGTH;
}

/** Staff only: a typed slot count must be a whole number in range (the backend's `IsInt`, `Min(0)`, `Max`). */
function isSlotsWrong(slots: number | null, canEditAll: boolean): boolean {
  if (!canEditAll || slots === null) return false;
  return !Number.isInteger(slots) || slots < 0 || slots > SLOTS_MAX;
}

export function checkOrganizationForm(
  form: OrganizationForm,
  canEditAll: boolean,
  isCreate: boolean,
): FieldErrors {
  const errors: FieldErrors = {};
  const messageOf = (key: string) => translate(`admin.organizations.errors.${key}`);
  if (form.name.trim().length === 0 || form.name.length > 128) errors.name = messageOf('name');
  if (!ORGANIZATION_SLUG_PATTERN.test(form.slug)) errors.slug = messageOf('slug');
  if (isShortNameWrong(form, canEditAll, isCreate)) errors.shortName = messageOf('shortName');
  if (isSlotsWrong(form.slots, canEditAll)) errors.slots = messageOf('slots');
  if (!LOGO_PATTERN.test(form.logoOverrideImage)) errors.logoOverrideImage = messageOf('logo');
  if (form.admins.length > MAX_ORGANIZATION_ADMINS) errors.adminIds = messageOf('admins');
  return errors;
}
