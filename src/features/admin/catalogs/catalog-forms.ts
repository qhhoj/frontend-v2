import type { LicenseAdmin, TaxonAdmin } from '@/api/types/problem-catalogs';
import { translate } from '@/i18n';
import type { FieldErrors } from '../ui/admin-errors';

export interface TaxonForm {
  name: string;
  fullName: string;
}
export interface LicenseForm {
  key: string;
  name: string;
  link: string;
  display: string;
  icon: string;
  text: string;
}

/** Same rules as the backend DTOs (`catalog-admin.dto.ts`). */
const LICENSE_KEY_PATTERN = /^[A-Za-z0-9._-]{1,20}$/;
const OPTIONAL_HTTP_URL = /^(https?:\/\/\S+)?$/;

export const emptyTaxonForm = (): TaxonForm => ({ name: '', fullName: '' });
export const taxonFormOf = ({ name, fullName }: TaxonAdmin): TaxonForm => ({ name, fullName });
export const emptyLicenseForm = (): LicenseForm => ({
  key: '',
  name: '',
  link: '',
  display: '',
  icon: '',
  text: '',
});
export const licenseFormOf = ({ key, name, link, display, icon, text }: LicenseAdmin) => ({
  key,
  name,
  link,
  display,
  icon,
  text,
});

/** The PATCH body: only the fields whose trimmed value changed. */
export function changedFields<Form extends object>(before: Form, after: Form): Partial<Form> {
  const patch: Partial<Form> = {};
  for (const key of Object.keys(after) as (keyof Form)[]) {
    const value = after[key];
    const sent = typeof value === 'string' ? (value.trim() as Form[keyof Form]) : value;
    if (sent !== before[key]) patch[key] = sent;
  }
  return patch;
}

/** The POST body: every field trimmed. */
export const trimmedForm = <Form extends object>(form: Form): Form =>
  Object.fromEntries(
    Object.entries(form).map(([key, value]) => [
      key,
      typeof value === 'string' ? value.trim() : value,
    ]),
  ) as Form;

const lengthError = (value: string, max: number) =>
  value.trim().length === 0 || value.trim().length > max
    ? translate('admin.catalogs.errors.length', { max })
    : undefined;

function withoutEmpty(errors: Record<string, string | undefined>): FieldErrors {
  return Object.fromEntries(
    Object.entries(errors).filter((entry): entry is [string, string] => entry[1] !== undefined),
  );
}

export const checkTaxonForm = (form: TaxonForm): FieldErrors =>
  withoutEmpty({ name: lengthError(form.name, 20), fullName: lengthError(form.fullName, 100) });

const urlError = (value: string) =>
  OPTIONAL_HTTP_URL.test(value.trim()) ? undefined : translate('admin.catalogs.errors.url');

export const checkLicenseForm = (form: LicenseForm): FieldErrors =>
  withoutEmpty({
    key: LICENSE_KEY_PATTERN.test(form.key.trim())
      ? undefined
      : translate('admin.catalogs.errors.key'),
    name: lengthError(form.name, 256),
    link: urlError(form.link),
    icon: urlError(form.icon),
  });
