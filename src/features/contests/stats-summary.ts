import type {
  ContestLanguageStats,
  ContestProblemResults,
  ContestStats,
} from '@/api/types/contests';
import type { Locale } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { VERDICT_TONES } from '@/lib/verdicts';
import type { VerdictTone } from '@/lib/verdicts';

export const RESULT_ORDER = [
  'AC',
  'WA',
  'CE',
  'TLE',
  'ERR',
  'RJ',
] as const satisfies readonly (keyof ContestProblemResults)[];
export type ResultCode = (typeof RESULT_ORDER)[number];
/** ERR groups the runtime-ish results, RJ the rejected ones; both reuse existing verdict tones. */
/** Each result takes its verdict's tone; ERR groups MLE, OLE, IR, RTE, AB and IE, so it takes RTE's. */
export const RESULT_TONES: Record<ResultCode, VerdictTone> = {
  AC: VERDICT_TONES.AC,
  WA: VERDICT_TONES.WA,
  CE: VERDICT_TONES.CE,
  TLE: VERDICT_TONES.TLE,
  ERR: VERDICT_TONES.RTE,
  RJ: VERDICT_TONES.RJ,
};

export function statsTotals(stats: ContestStats) {
  const submissions = stats.problems.reduce((sum, problem) => sum + problem.total, 0);
  const accepted = stats.problems.reduce((sum, problem) => sum + problem.results.AC, 0);
  return { submissions, accepted, acceptedShare: submissions > 0 ? accepted / submissions : null };
}

export const resultSegments = (results: ContestProblemResults, total: number) =>
  total > 0
    ? RESULT_ORDER.filter((code) => results[code] > 0).map((code) => ({
        code,
        count: results[code],
        share: results[code] / total,
      }))
    : [];

export function languageShare(
  language: ContestLanguageStats,
  languages: ContestLanguageStats[],
): number {
  const all = languages.reduce((sum, entry) => sum + entry.count, 0);
  return all > 0 ? language.count / all : 0;
}

export const formatPercent = (value: number, locale: Locale) =>
  `${formatNumber(value, locale, 1)}%`;

export interface StatTile {
  id: 'submissions' | 'accepted' | 'problems' | 'participants';
  value: string;
  labelKey: string;
}

/** The four headline numbers; the accepted share reads as a dash while nothing was submitted. */
export function statTiles(
  stats: ContestStats,
  participantCount: number,
  locale: Locale,
): StatTile[] {
  const totals = statsTotals(stats);
  return [
    {
      id: 'submissions',
      value: formatNumber(totals.submissions, locale),
      labelKey: 'contests.stats.submissions',
    },
    {
      id: 'accepted',
      value:
        totals.acceptedShare === null ? '—' : formatPercent(totals.acceptedShare * 100, locale),
      labelKey: 'contests.stats.accepted',
    },
    {
      id: 'problems',
      value: formatNumber(stats.problems.length, locale),
      labelKey: 'contests.stats.problems',
    },
    {
      id: 'participants',
      value: formatNumber(participantCount, locale),
      labelKey: 'contests.stats.participants',
    },
  ];
}
