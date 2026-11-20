import type { OrganizationChip, UserChip } from '@/api/types/admin-common';
import type {
  ContestFormatName,
  ContestSettings,
  EditableContest,
  LabelStyle,
  ScoreboardVisibility,
  UserSummaryView,
} from '@/api/types/contest-editing';
import { configFor } from './format-config';

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
  /** The five times are ISO instants (`toISOString`, so equal instants compare equal); '' is unset. */
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

/** An API instant in one spelling (`…T06:00:00.000Z`), so a retyped time equal to the stored one is no change; null is ''. */
const instantOf = (iso: string | null): string => (iso ? new Date(iso).toISOString() : '');

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
    startTime: instantOf(contest.startTime),
    endTime: instantOf(contest.endTime),
    timeLimit: contest.timeLimit,
    registrationStart: instantOf(contest.registrationStart),
    registrationEnd: instantOf(contest.registrationEnd),
    lockedAfter: instantOf(settings.lockedAfter),
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
