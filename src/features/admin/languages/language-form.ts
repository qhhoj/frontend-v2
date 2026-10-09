import type {
  CreateLanguageBody,
  LanguageAdmin,
  UpdateLanguageBody,
} from '@/api/types/languages-admin';
import { translate } from '@/i18n';
import type { FieldErrors } from '../ui/admin-errors';

/** The backend's limits (`language-admin.dto.ts`); the form checks them before sending, so a refusal is never the first news. */
export const LANGUAGE_LIMITS = {
  keyPattern: /^[A-Za-z0-9_+#.-]{1,10}$/,
  extensionPattern: /^[a-z0-9]{1,10}$/,
  name: 20,
  editor: 50,
  text: 65_536,
  fileSize: 1_073_741_824,
} as const;
const BYTES_PER_MEGABYTE = 1_048_576;

/** Every typed value is a string, except the two checkboxes; the file size is kept as typed until it is sent. */
export interface LanguageForm {
  key: string;
  name: string;
  shortName: string;
  commonName: string;
  ace: string;
  pygments: string;
  extension: string;
  fileSizeLimit: string;
  fileOnly: boolean;
  includeInProblem: boolean;
  template: string;
  info: string;
  description: string;
}

export const emptyLanguageForm = (): LanguageForm => ({
  key: '',
  name: '',
  shortName: '',
  commonName: '',
  ace: '',
  pygments: '',
  extension: '',
  fileSizeLimit: '0',
  fileOnly: false,
  includeInProblem: false,
  template: '',
  info: '',
  description: '',
});

export const formOf = (language: LanguageAdmin): LanguageForm => ({
  key: language.key,
  name: language.name,
  shortName: language.shortName ?? '',
  commonName: language.commonName,
  ace: language.ace,
  pygments: language.pygments,
  extension: language.extension,
  fileSizeLimit: String(language.fileSizeLimit),
  fileOnly: language.fileOnly,
  includeInProblem: language.includeInProblem,
  template: language.template,
  info: language.info,
  description: language.description,
});

const isFileSize = (text: string) => /^\d+$/.test(text) && Number(text) <= LANGUAGE_LIMITS.fileSize;
const isOutside = (text: string, min: number, max: number) =>
  text.length < min || text.length > max;

/** Each rule: the field, whether it is wrong, and the message id under `admin.languages.form.errors`. */
function rulesFor(
  form: LanguageForm,
  mode: 'create' | 'edit',
): [keyof LanguageForm, boolean, string][] {
  const { name, editor, text } = LANGUAGE_LIMITS;
  return [
    ['key', mode === 'create' && !LANGUAGE_LIMITS.keyPattern.test(form.key), 'key'],
    ['name', isOutside(form.name, 1, name), 'name'],
    ['shortName', form.shortName !== '' && isOutside(form.shortName, 1, name), 'shortName'],
    ['commonName', isOutside(form.commonName, 1, name), 'name'],
    ['ace', isOutside(form.ace, 1, editor), 'editor'],
    ['pygments', isOutside(form.pygments, 1, editor), 'editor'],
    ['extension', !LANGUAGE_LIMITS.extensionPattern.test(form.extension), 'extension'],
    ['fileSizeLimit', !isFileSize(form.fileSizeLimit), 'fileSize'],
    ['template', form.template.length > text, 'text'],
    ['info', form.info.length > text, 'text'],
    ['description', form.description.length > text, 'text'],
  ];
}

export function checkLanguageForm(form: LanguageForm, mode: 'create' | 'edit'): FieldErrors {
  const errors: FieldErrors = {};
  for (const [field, isWrong, message] of rulesFor(form, mode))
    if (isWrong) errors[field] = translate(`admin.languages.form.errors.${message}`);
  return errors;
}

export const createBodyOf = (form: LanguageForm): CreateLanguageBody => ({
  key: form.key,
  name: form.name,
  ...(form.shortName !== '' && { shortName: form.shortName }),
  commonName: form.commonName,
  ace: form.ace,
  pygments: form.pygments,
  extension: form.extension,
  fileOnly: form.fileOnly,
  fileSizeLimit: Number(form.fileSizeLimit),
  includeInProblem: form.includeInProblem,
  template: form.template,
  info: form.info,
  description: form.description,
});

const TEXT_FIELDS = [
  'name',
  'commonName',
  'ace',
  'pygments',
  'extension',
  'template',
  'info',
  'description',
] as const;

/** Only what differs from the stored language; `null` is how the backend clears a short name. */
export function patchOf(before: LanguageAdmin, form: LanguageForm): UpdateLanguageBody {
  const patch: UpdateLanguageBody = {};
  for (const field of TEXT_FIELDS) if (form[field] !== before[field]) patch[field] = form[field];
  if (form.shortName !== (before.shortName ?? ''))
    patch.shortName = form.shortName === '' ? null : form.shortName;
  const size = Number(form.fileSizeLimit);
  if (size !== before.fileSizeLimit) patch.fileSizeLimit = size;
  if (form.fileOnly !== before.fileOnly) patch.fileOnly = form.fileOnly;
  if (form.includeInProblem !== before.includeInProblem)
    patch.includeInProblem = form.includeInProblem;
  return patch;
}

export const megabytesOf = (text: string): number | null =>
  isFileSize(text) ? Math.round(Number(text) / BYTES_PER_MEGABYTE) : null;
