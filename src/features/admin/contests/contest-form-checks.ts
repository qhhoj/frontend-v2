import { translate } from '@/i18n';
import type { FieldErrors } from '../ui/admin-errors';
import { FORMAT_FIELDS } from './format-config';
import type { ContestForm } from './contest-form';

// Client-side checks of a contest form before a save; the server checks again.

/** A whole number in range; a cleared number box is '' or NaN, and neither may reach the server. */
const isWholeIn = (value: unknown, min: number, max: number) =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;

type Message = (key: string) => string;
const isBadCount = (value: number, max = Number.POSITIVE_INFINITY) =>
  Number.isNaN(value) || value < 0 || value > max;

function checkWindow(form: ContestForm, message: Message): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.startTime) errors.startTime = message('required');
  if (!form.endTime) errors.endTime = message('required');
  else if (form.startTime && Date.parse(form.endTime) <= Date.parse(form.startTime))
    errors.endTime = message('endBeforeStart');
  return errors;
}

/** Clearable number boxes: text the browser cannot read is NaN, and is refused rather than saved as a clear. */
const UNREADABLE_CHECKED_FIELDS = ['timeLimit', 'ratingFloor', 'ratingCeiling'] as const;

function checkNumbers(form: ContestForm, message: Message): FieldErrors {
  const errors: FieldErrors = {};
  if (isBadCount(form.scoreboardCacheTimeout, 86_400))
    errors.scoreboardCacheTimeout = message('cacheTimeout');
  if (isBadCount(form.frozenLastMinutes)) errors.frozenLastMinutes = message('frozen');
  if (form.tags.length > 20) errors.tags = message('tags');
  if (!isWholeIn(form.pointsPrecision, 0, 10)) errors.pointsPrecision = message('pointsPrecision');
  for (const field of UNREADABLE_CHECKED_FIELDS)
    if (Number.isNaN(form[field])) errors[field] = message('notNumber');
  return errors;
}

function checkRating(form: ContestForm, message: Message): FieldErrors {
  const { ratingFloor: floor, ratingCeiling: ceiling } = form;
  return floor !== null && ceiling !== null && floor > ceiling
    ? { ratingCeiling: message('ratingRange') }
    : {};
}

/** Each minutes field of the chosen format must be a whole, non-negative number (`formatConfig.<name>`). */
function checkFormatConfig(form: ContestForm, message: Message): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of FORMAT_FIELDS[form.formatName]) {
    if (
      field.kind === 'minutes' &&
      !isWholeIn(form.formatConfig[field.name], 0, Number.MAX_SAFE_INTEGER)
    )
      errors[`formatConfig.${field.name}`] = message('penalty');
  }
  return errors;
}

/** backend `CONTEST_RULES_MAX`. */
export const RULES_MAX_LENGTH = 8192;

function checkOperations(form: ContestForm): FieldErrors {
  return form.rules.length > RULES_MAX_LENGTH
    ? { rules: translate('admin.contestRules.errors.rules', { max: RULES_MAX_LENGTH }) }
    : {};
}

/** backend `IMAGE_URL_PATTERN`: empty, an http(s) URL or a site path (not `//host`), at most 150 characters. */
const IMAGE_URL_PATTERN = /^(|https?:\/\/[^\s"'<>]+|\/(?!\/)[^\s"'<>]*)$/;
const IMAGE_URL_MAX = 150;

function checkImages(form: ContestForm, message: Message): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of ['ogImage', 'logoOverrideImage'] as const) {
    const value = form[field];
    if (value.length > IMAGE_URL_MAX || !IMAGE_URL_PATTERN.test(value))
      errors[field] = message('imageUrl');
  }
  return errors;
}

/** The backend's contest key rule (`CONTEST_KEY_PATTERN`): lowercase letters, digits and underscores, 1 to 32. */
export const CONTEST_KEY_PATTERN = /^[a-z0-9_]{1,32}$/;
const CONTEST_NAME_MAX = 100;

/** What only a new contest checks: its key (an old key is never re-checked) and its name, before any request. */
export function checkContestIdentity(form: Pick<ContestForm, 'key' | 'name'>): FieldErrors {
  const message: Message = (key) => translate(`admin.contests.general.errors.${key}`);
  const errors: FieldErrors = {};
  if (!CONTEST_KEY_PATTERN.test(form.key)) errors.key = message('key');
  const nameLength = form.name.trim().length;
  if (nameLength < 1 || nameLength > CONTEST_NAME_MAX) errors.name = message('name');
  return errors;
}

export function checkContestForm(form: ContestForm): FieldErrors {
  const message: Message = (key) => translate(`admin.contests.general.errors.${key}`);
  return {
    ...checkWindow(form, message),
    ...checkNumbers(form, message),
    ...checkRating(form, message),
    ...checkFormatConfig(form, message),
    ...checkOperations(form),
    ...checkImages(form, message),
  };
}
