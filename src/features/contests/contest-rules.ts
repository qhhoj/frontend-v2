import type { ContestDetail, ContestFormatName } from '@/api/types/contests';
import { translate } from '@/i18n';
import type { Locale } from '@/i18n';
import { freezeStart, spanMessage } from '@/lib/contest-time';
import { formatDateTime } from '@/lib/format';

/** One line of the rules card: `termKey` names the left column, `valueKey` the right one. */
export interface RuleRow {
  termKey: string;
  valueKey: string;
  params: Record<string, string | number>;
  /** Params that are message keys themselves; the card translates them before filling `valueKey`. */
  paramKeys?: Record<string, string>;
  /** A message key appended after the value, e.g. the "per participation" of a time limit. */
  suffixKey?: string;
}

type RowExtras = Pick<RuleRow, 'paramKeys' | 'suffixKey'>;

/** Backend formats/icpc.ts and vnoj.ts defaults, used when the stored config lacks `penalty`. */
export const DEFAULT_PENALTY_MINUTES: Partial<Record<ContestFormatName, number>> = {
  icpc: 20,
  vnoj: 5,
};

const row = (
  term: string,
  valueKey: string,
  params: RuleRow['params'] = {},
  extras: RowExtras = {},
): RuleRow => ({ termKey: `contests.rules.${term}`, valueKey, params, ...extras });

function formatRule(contest: ContestDetail): RuleRow {
  const format = translate(`formats.${contest.formatName}`);
  const fallback = DEFAULT_PENALTY_MINUTES[contest.formatName];
  if (fallback === undefined) return row('format', 'contests.rules.formatOnly', { format });
  const stored = contest.formatConfig.penalty;
  const minutes = typeof stored === 'number' ? stored : fallback;
  return row('format', 'contests.rules.formatWithPenalty', { format, minutes });
}

function scoreboardRule(contest: ContestDetail): RuleRow {
  const visibilityKey = `contests.rules.visibility.${contest.scoreboardVisibility}`;
  return freezeStart(contest) === null
    ? row('scoreboard', visibilityKey)
    : row(
        'scoreboard',
        'contests.rules.scoreboardFrozen',
        { minutes: contest.frozenLastMinutes },
        { paramKeys: { visibility: visibilityKey } },
      );
}

function registrationRule(contest: ContestDetail, locale: Locale): RuleRow[] {
  const { registrationStart: start, registrationEnd: end } = contest;
  const at = (instant: string) => formatDateTime(instant, locale);
  if (start !== null && end !== null) {
    return [
      row('registration', 'contests.rules.registrationBetween', { start: at(start), end: at(end) }),
    ];
  }
  if (start !== null)
    return [row('registration', 'contests.rules.registrationFrom', { start: at(start) })];
  if (end !== null)
    return [row('registration', 'contests.rules.registrationUntil', { end: at(end) })];
  return [];
}

function timeLimitRule(contest: ContestDetail): RuleRow[] {
  if (contest.timeLimit === null) return [];
  const span = spanMessage(contest.timeLimit);
  return [
    row('timeLimit', span.key, span.params, { suffixKey: 'contests.rules.perParticipation' }),
  ];
}

/** The "Thể thức & quy định" card, top to bottom. */
export const contestRules = (contest: ContestDetail, locale: Locale): RuleRow[] => [
  formatRule(contest),
  scoreboardRule(contest),
  row('rating', contest.isRated ? 'contests.rules.rated' : 'contests.rules.unrated'),
  row(
    'virtual',
    contest.disallowVirtual ? 'contests.rules.virtualOff' : 'contests.rules.virtualOn',
  ),
  row('labelsTerm', `contests.rules.labels.${contest.labelStyle}`),
  row(
    'judging',
    contest.runPretestsOnly ? 'contests.rules.pretestsOnly' : 'contests.rules.fullTests',
  ),
  row(
    'submissionList',
    contest.showSubmissionList ? 'contests.rules.listOpen' : 'contests.rules.listAfterEnd',
  ),
  ...timeLimitRule(contest),
  ...registrationRule(contest, locale),
];
