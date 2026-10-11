import type { RequiredPart } from '@/api/typed';
import type { OrganizationChip, UserChip } from '@/api/types/admin-common';
import type {
  ContestBody,
  ContestFormatName,
  ContestPatch,
  ContestSettings,
  EditableContest,
  LabelStyle,
  ScoreboardVisibility,
  UserSummaryView,
} from '@/api/types/contest-editing';
import { translate } from '@/i18n';
import type { FieldErrors } from '../ui/admin-errors';
import { fromLocalInput, toLocalInput } from '../ui/datetime';
import { configFor, FORMAT_FIELDS } from './format-config';

export interface ContestForm {
  key: string;
  name: string;
  summary: string;
  description: string;
  /** Link-preview image: an http(s) URL or a site path; '' for the site image. */
  ogImage: string;
  /** Shown instead of the site logo inside the contest: an http(s) URL or a site path; '' for none. */
  logoOverrideImage: string;
  tags: string[];
  authors: UserChip[];
  curators: UserChip[];
  testers: UserChip[];
  startTime: string;
  endTime: string;
  timeLimit: number | null;
  registrationStart: string;
  registrationEnd: string;
  lockedAfter: string;
  frozenLastMinutes: number;
  disallowVirtual: boolean;
  formatName: ContestFormatName;
  formatConfig: Record<string, number | boolean>;
  labelStyle: LabelStyle;
  pointsPrecision: number;
  runPretestsOnly: boolean;
  hideProblemTags: boolean;
  hideProblemAuthors: boolean;
  showShortDisplay: boolean;
  showSubmissionList: boolean;
  /** Read back from `settings.pushAnnouncements`; a plain switch, sent when changed. */
  pushAnnouncements: boolean;
  scoreboardVisibility: ScoreboardVisibility;
  scoreboardCacheTimeout: number;
  viewContestScoreboard: UserChip[];
  /** Hashed, never returned (`requiresAccessCode` and `settings.hasRankingAccessCode` only say one is set): '' keeps the stored code; `remove…` sends '' (removes it). */
  accessCode: string;
  removeAccessCode: boolean;
  rankingAccessCode: string;
  removeRankingAccessCode: boolean;
  isVisible: boolean;
  isPrivate: boolean;
  privateContestants: UserChip[];
  isOrganizationPrivate: boolean;
  organizations: OrganizationChip[];
  bannedUsers: UserChip[];
  bannedJudges: string[];
  isRated: boolean;
  rateAll: boolean;
  rateExclude: UserChip[];
  ratingFloor: number | null;
  ratingCeiling: number | null;
  /** Markdown; '' means the contest has no rules (the backend trims). */
  rules: string;
  balloons: boolean;
  /** Balloon volunteers (`balloonStaff`): may use the balloon screen without editing the contest. */
  balloonStaff: UserChip[];
}

type Part<Keys extends keyof ContestForm> = Pick<ContestForm, Keys>;

/** `RefuseNullFieldsPipe` lets only these be null on PATCH. */
export const NULLABLE_CONTEST_FIELDS = [
  'timeLimit',
  'registrationStart',
  'registrationEnd',
  'lockedAfter',
  'ratingFloor',
  'ratingCeiling',
] as const;
/**
 * Fields the backend gates on a permission when a create changes them (C2). A create by an account without the permission leaves the
 * whole group out of the body, so the plain `judge.add_contest` holder never gets a 403 for a default (`rateAll` included).
 */
export const GATED_CONTEST_FIELDS: Record<string, readonly (keyof ContestForm)[]> = {
  'judge.contest_rating': ['isRated', 'rateAll', 'rateExclude', 'ratingFloor', 'ratingCeiling'],
  'judge.lock_contest': ['lockedAfter'],
  'judge.create_private_contest': [
    'isPrivate',
    'privateContestants',
    'isOrganizationPrivate',
    'organizations',
  ],
  'judge.contest_access_code': ['accessCode'],
  'judge.change_contest_visibility': ['isVisible'],
};
const DATE_FIELDS = [
  'startTime',
  'endTime',
  'registrationStart',
  'registrationEnd',
  'lockedAfter',
] as const;
const CHIP_FIELDS = [
  'authors',
  'curators',
  'testers',
  'viewContestScoreboard',
  'privateContestants',
  'bannedUsers',
  'rateExclude',
  'organizations',
  'balloonStaff',
] as const;
/** Handled by `specialFields`, never compared plainly. */
const SPECIAL = [
  'accessCode',
  'removeAccessCode',
  'rankingAccessCode',
  'removeRankingAccessCode',
  'formatConfig',
];

/** The settings send ids; `settings.users` names them (all but a deleted account). */
const chipsFrom = (ids: string[], users: UserSummaryView[]): UserChip[] =>
  ids.map((id) => ({ id, username: users.find((user) => user.id === id)?.username ?? null }));
const nameChips = (users: UserSummaryView[]): UserChip[] =>
  users.map(({ id, username }) => ({ id, username }));
const organizationChips = (ids: string[]): OrganizationChip[] =>
  ids.map((id) => ({ id, slug: null }));

function requireSettings(contest: EditableContest): ContestSettings {
  if (contest.settings === null)
    throw new Error(`Contest ${contest.key} was read without editor settings`);
  return contest.settings;
}

function basicsOf(
  contest: EditableContest,
  settings: ContestSettings,
): Part<
  | 'key'
  | 'name'
  | 'summary'
  | 'description'
  | 'ogImage'
  | 'logoOverrideImage'
  | 'tags'
  | 'authors'
  | 'curators'
  | 'testers'
> {
  return {
    key: contest.key,
    name: contest.name,
    summary: contest.summary,
    description: contest.description,
    ogImage: settings.ogImage,
    logoOverrideImage: contest.logoOverrideImage,
    tags: [...contest.tags],
    authors: nameChips(contest.authors),
    curators: chipsFrom(settings.curators, settings.users),
    testers: chipsFrom(settings.testers, settings.users),
  };
}

function timesOf(
  contest: EditableContest,
  settings: ContestSettings,
): Part<
  | 'startTime'
  | 'endTime'
  | 'timeLimit'
  | 'registrationStart'
  | 'registrationEnd'
  | 'lockedAfter'
  | 'frozenLastMinutes'
  | 'disallowVirtual'
> {
  return {
    startTime: toLocalInput(contest.startTime),
    endTime: toLocalInput(contest.endTime),
    timeLimit: contest.timeLimit,
    registrationStart: toLocalInput(contest.registrationStart),
    registrationEnd: toLocalInput(contest.registrationEnd),
    lockedAfter: toLocalInput(settings.lockedAfter),
    frozenLastMinutes: contest.frozenLastMinutes,
    disallowVirtual: contest.disallowVirtual,
  };
}

function formatOf(
  contest: EditableContest,
  settings: ContestSettings,
): Part<
  | 'formatName'
  | 'formatConfig'
  | 'labelStyle'
  | 'pointsPrecision'
  | 'runPretestsOnly'
  | 'hideProblemTags'
  | 'hideProblemAuthors'
  | 'showShortDisplay'
  | 'showSubmissionList'
  | 'pushAnnouncements'
> {
  return {
    formatName: contest.formatName,
    formatConfig: configFor(contest.formatName, contest.formatConfig),
    labelStyle: contest.labelStyle,
    pointsPrecision: contest.pointsPrecision,
    runPretestsOnly: contest.runPretestsOnly,
    hideProblemTags: contest.hideProblemTags,
    hideProblemAuthors: contest.hideProblemAuthors,
    showShortDisplay: contest.showShortDisplay,
    showSubmissionList: contest.showSubmissionList,
    pushAnnouncements: settings.pushAnnouncements,
  };
}

/** The codes are never shown: both boxes start empty and both removal boxes off. */
function accessOf(
  contest: EditableContest,
  settings: ContestSettings,
): Part<
  | 'scoreboardVisibility'
  | 'scoreboardCacheTimeout'
  | 'viewContestScoreboard'
  | 'accessCode'
  | 'removeAccessCode'
  | 'rankingAccessCode'
  | 'removeRankingAccessCode'
> {
  return {
    scoreboardVisibility: contest.scoreboardVisibility,
    scoreboardCacheTimeout: settings.scoreboardCacheTimeout,
    viewContestScoreboard: chipsFrom(settings.viewContestScoreboard, settings.users),
    accessCode: '',
    removeAccessCode: false,
    rankingAccessCode: '',
    removeRankingAccessCode: false,
  };
}

function visibilityOf(
  contest: EditableContest,
  settings: ContestSettings,
): Part<
  | 'isVisible'
  | 'isPrivate'
  | 'privateContestants'
  | 'isOrganizationPrivate'
  | 'organizations'
  | 'bannedUsers'
  | 'bannedJudges'
> {
  return {
    isVisible: settings.isVisible,
    isPrivate: contest.isPrivate,
    privateContestants: chipsFrom(settings.privateContestants, settings.users),
    isOrganizationPrivate: contest.isOrganizationPrivate,
    organizations: organizationChips(settings.organizations),
    bannedUsers: chipsFrom(settings.bannedUsers, settings.users),
    bannedJudges: [...settings.bannedJudges],
  };
}

function ratingOf(
  contest: EditableContest,
  settings: ContestSettings,
): Part<'isRated' | 'rateAll' | 'rateExclude' | 'ratingFloor' | 'ratingCeiling'> {
  return {
    isRated: contest.isRated,
    rateAll: settings.rateAll,
    rateExclude: chipsFrom(settings.rateExclude, settings.users),
    ratingFloor: settings.ratingFloor,
    ratingCeiling: settings.ratingCeiling,
  };
}

function operationsOf(
  contest: EditableContest,
  settings: ContestSettings,
): Part<'rules' | 'balloons' | 'balloonStaff'> {
  return {
    rules: contest.rules,
    balloons: settings.balloons,
    balloonStaff: chipsFrom(settings.balloonStaff, settings.users),
  };
}

export function toContestForm(contest: EditableContest): ContestForm {
  const settings = requireSettings(contest);
  return {
    ...basicsOf(contest, settings),
    ...timesOf(contest, settings),
    ...formatOf(contest, settings),
    ...accessOf(contest, settings),
    ...visibilityOf(contest, settings),
    ...ratingOf(contest, settings),
    ...operationsOf(contest, settings),
  };
}

const emptyIdentity = (): Part<
  | 'key'
  | 'name'
  | 'summary'
  | 'description'
  | 'ogImage'
  | 'logoOverrideImage'
  | 'tags'
  | 'authors'
  | 'curators'
  | 'testers'
> => ({
  key: '',
  name: '',
  summary: '',
  description: '',
  ogImage: '',
  logoOverrideImage: '',
  tags: [],
  authors: [],
  curators: [],
  testers: [],
});
const emptyTimes = (): Part<
  | 'startTime'
  | 'endTime'
  | 'timeLimit'
  | 'registrationStart'
  | 'registrationEnd'
  | 'lockedAfter'
  | 'frozenLastMinutes'
  | 'disallowVirtual'
> => ({
  startTime: '',
  endTime: '',
  timeLimit: null,
  registrationStart: '',
  registrationEnd: '',
  lockedAfter: '',
  frozenLastMinutes: 0,
  disallowVirtual: false,
});
/** The backend's create baseline: the default format, alpha labels, two decimals of points, no switch on. */
const emptyFormat = (): Part<
  | 'formatName'
  | 'formatConfig'
  | 'labelStyle'
  | 'pointsPrecision'
  | 'runPretestsOnly'
  | 'hideProblemTags'
  | 'hideProblemAuthors'
  | 'showShortDisplay'
  | 'showSubmissionList'
  | 'pushAnnouncements'
> => ({
  formatName: 'default',
  formatConfig: {},
  labelStyle: 'alpha',
  pointsPrecision: 2,
  runPretestsOnly: false,
  hideProblemTags: false,
  hideProblemAuthors: false,
  showShortDisplay: false,
  showSubmissionList: false,
  pushAnnouncements: false,
});
const emptyAccess = (): Part<
  | 'scoreboardVisibility'
  | 'scoreboardCacheTimeout'
  | 'viewContestScoreboard'
  | 'accessCode'
  | 'removeAccessCode'
  | 'rankingAccessCode'
  | 'removeRankingAccessCode'
> => ({
  scoreboardVisibility: 'V',
  scoreboardCacheTimeout: 0,
  viewContestScoreboard: [],
  accessCode: '',
  removeAccessCode: false,
  rankingAccessCode: '',
  removeRankingAccessCode: false,
});
const emptyVisibility = (): Part<
  | 'isVisible'
  | 'isPrivate'
  | 'privateContestants'
  | 'isOrganizationPrivate'
  | 'organizations'
  | 'bannedUsers'
  | 'bannedJudges'
> => ({
  isVisible: false,
  isPrivate: false,
  privateContestants: [],
  isOrganizationPrivate: false,
  organizations: [],
  bannedUsers: [],
  bannedJudges: [],
});
/** `rateAll` starts false: `true` would be a change, and the rating group needs `judge.contest_rating` to send it. */
const emptyRating = (): Part<
  'isRated' | 'rateAll' | 'rateExclude' | 'ratingFloor' | 'ratingCeiling'
> => ({
  isRated: false,
  rateAll: false,
  rateExclude: [],
  ratingFloor: null,
  ratingCeiling: null,
});

const emptyOperations = (): Part<'rules' | 'balloons' | 'balloonStaff'> => ({
  rules: '',
  balloons: false,
  balloonStaff: [],
});

export const emptyContestForm = (): ContestForm => ({
  ...emptyIdentity(),
  ...emptyTimes(),
  ...emptyFormat(),
  ...emptyAccess(),
  ...emptyVisibility(),
  ...emptyRating(),
  ...emptyOperations(),
});

const sameJson = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
const isNullable = (key: string) => (NULLABLE_CONTEST_FIELDS as readonly string[]).includes(key);
const isEmptyValue = (value: unknown): boolean =>
  value === undefined ||
  value === null ||
  value === '' ||
  (Array.isArray(value) && value.length === 0);

/** A form value as the DTO wants it, or `undefined` when it must not be sent (a non-nullable field left empty). */
function sentValue(key: keyof ContestForm, value: unknown): unknown {
  if ((CHIP_FIELDS as readonly string[]).includes(key))
    return (value as UserChip[]).map((chip) => chip.id);
  if ((DATE_FIELDS as readonly string[]).includes(key)) {
    const iso = fromLocalInput(value as string);
    return iso ?? (isNullable(key) ? null : undefined);
  }
  if (typeof value === 'number' && Number.isNaN(value)) return undefined;
  if (value === null) return isNullable(key) ? null : undefined;
  return value;
}

/** The access codes and the format: sent only when typed, removed, or changed. */
function specialFields(before: ContestForm, after: ContestForm): ContestPatch {
  const patch: Record<string, unknown> = {};
  if (after.removeAccessCode) patch.accessCode = '';
  else if (after.accessCode !== '') patch.accessCode = after.accessCode;
  if (after.removeRankingAccessCode) patch.rankingAccessCode = '';
  else if (after.rankingAccessCode !== '') patch.rankingAccessCode = after.rankingAccessCode;
  if (!sameJson(before.formatConfig, after.formatConfig) || before.formatName !== after.formatName)
    patch.formatConfig = after.formatConfig;
  return patch;
}

/** Only the changed members, with the PATCH meaning of null (a cleared nullable field) and never a null for a field that refuses it. */
export function changedContestFields(before: ContestForm, after: ContestForm): ContestPatch {
  const patch: Record<string, unknown> = { ...specialFields(before, after) };
  for (const key of Object.keys(after) as (keyof ContestForm)[]) {
    if (SPECIAL.includes(key) || key === 'key' || sameJson(before[key], after[key])) continue;
    const value = sentValue(key, after[key]);
    if (value !== undefined) patch[key] = value;
  }
  return patch;
}

const isGatedOff = (key: keyof ContestForm, can: (permission: string) => boolean) =>
  Object.entries(GATED_CONTEST_FIELDS).some(
    ([permission, fields]) => fields.includes(key) && !can(permission),
  );

/** The create body's optional members that are filled and that `can` lets through (a gated group needs its permission). */
function filledFields(
  form: ContestForm,
  can: (permission: string) => boolean,
): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  for (const key of Object.keys(form) as (keyof ContestForm)[]) {
    if (SPECIAL.includes(key) || isGatedOff(key, can)) continue;
    const value = sentValue(key, form[key]);
    if (!isEmptyValue(value)) fields[key] = value;
  }
  return fields;
}

/** The POST body: required fields always, optional ones only when filled, and a permission-gated group only when `can` holds its permission. */
export function toContestBody(
  form: ContestForm,
  can: (permission: string) => boolean,
): ContestBody {
  const optional = { ...specialFields(emptyContestForm(), form), ...filledFields(form, can) };
  if (!can('judge.contest_access_code')) delete optional.accessCode;
  return { ...optional, ...requiredContestFields(form) };
}

/** Typed from the generated body: a required member the backend adds is a compile error here until it is listed. */
const requiredContestFields = (form: ContestForm): RequiredPart<ContestBody> => ({
  key: form.key,
  name: form.name,
  startTime: fromLocalInput(form.startTime) ?? '',
  endTime: fromLocalInput(form.endTime) ?? '',
});

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
  else if (form.startTime && form.endTime <= form.startTime)
    errors.endTime = message('endBeforeStart');
  return errors;
}

function checkNumbers(form: ContestForm, message: Message): FieldErrors {
  const errors: FieldErrors = {};
  if (isBadCount(form.scoreboardCacheTimeout, 86_400))
    errors.scoreboardCacheTimeout = message('cacheTimeout');
  if (isBadCount(form.frozenLastMinutes)) errors.frozenLastMinutes = message('frozen');
  if (form.tags.length > 20) errors.tags = message('tags');
  if (!isWholeIn(form.pointsPrecision, 0, 10)) errors.pointsPrecision = message('pointsPrecision');
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
