import type { FlatpageBody } from '@/api/types/flatpages-admin';
import { ApiError } from '@/api/client';
import { translate } from '@/i18n';
import { isConflict } from '../ui/admin-errors';
import type { FieldErrors } from '../ui/admin-errors';

const URL_CHARSET = /^[-\p{L}\p{N}_/.~]+$/u;
export const FLATPAGE_LIMITS = { url: 200, title: 200, content: 100_000 } as const;

// The backend refuses control characters in a page URL.
const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/;

/** Backend `normalizeFlatpageUrl`: not trimmed, empty segments dropped, `null` for no segment, a dot segment, a control character or too long. */
export function canonicalUrl(raw: string): string | null {
  if (raw.length > FLATPAGE_LIMITS.url || CONTROL_CHARACTER.test(raw)) return null;
  const segments = raw.split('/').filter(Boolean);
  if (segments.length === 0 || segments.some((part) => part === '.' || part === '..')) return null;
  return `/${segments.join('/')}`;
}

export function checkFlatpageForm(
  form: Pick<FlatpageBody, 'url' | 'title' | 'content'>,
): FieldErrors {
  const errors: FieldErrors = {};
  const url = canonicalUrl(form.url);
  if (url === null || !URL_CHARSET.test(url) || url.length > FLATPAGE_LIMITS.url)
    errors.url = translate('admin.pages.errors.url');
  if (form.title.trim().length === 0 || form.title.length > FLATPAGE_LIMITS.title)
    errors.title = translate('admin.pages.errors.title');
  if (form.content.length > FLATPAGE_LIMITS.content)
    errors.content = translate('admin.pages.errors.content');
  return errors;
}

export function changedFlatpageFields(
  before: FlatpageBody,
  after: FlatpageBody,
): Partial<FlatpageBody> {
  const patch: Partial<FlatpageBody> = {};
  for (const key of Object.keys(after) as (keyof FlatpageBody)[])
    if (before[key] !== after[key])
      Object.assign(patch, { [key]: key === 'url' ? canonicalUrl(after.url) : after[key] });
  return patch;
}

/** The URL's own refusals from the server, under the URL box: a taken URL (409 `fields.url`) or the `invalid_url` issue. */
export function serverUrlError(error: unknown, url: string): string | null {
  if (!(error instanceof ApiError)) return null;
  if (isConflict(error) && error.fields.url) return translate('admin.pages.errors.taken', { url });
  if (error.issues.some((issue) => issue.field === 'url' && issue.code === 'invalid_url'))
    return translate('admin.pages.errors.url');
  return null;
}
