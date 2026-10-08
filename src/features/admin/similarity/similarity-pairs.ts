import type { LocationQuery } from 'vue-router';
import type {
  PairDetailSide,
  PairsRequest,
  SimilarityFragment,
  SimilarityGroup,
} from '@/api/types/similarity';
import type { SubmissionResult } from '@/api/types/submissions';
import type { Verdict } from '@/lib/verdicts';
import { VERDICT_CODES, VERDICT_TONES } from '@/lib/verdicts';

/** The pairs filter as the URL names it: an empty field is "all", a null threshold is "none". */
export interface PairFilter {
  problemId: string;
  language: string;
  minPercent: number | null;
  page: number;
}

const MAX_PERCENT = 100;
const text = (value: LocationQuery[string] | undefined) => (typeof value === 'string' ? value : '');
const percentOf = (value: string) => {
  const number = Number(value);
  return value !== '' && Number.isFinite(number) && number >= 0 && number <= MAX_PERCENT
    ? number
    : null;
};
const pageOf = (value: string) => (/^[1-9]\d*$/.test(value) ? Number(value) : 1);

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** The backend takes a problem filter only as a uuid (`IsUUID`); anything else is dropped, not sent. */
const problemIdOf = (value: string) => (UUID_PATTERN.test(value) ? value : '');

export const pairFilterFromQuery = (query: LocationQuery): PairFilter => ({
  problemId: problemIdOf(text(query.problemId)),
  language: text(query.language),
  minPercent: percentOf(text(query.minPercent)),
  page: pageOf(text(query.page)),
});

/** The URL of a filter: a default value leaves its parameter out. */
export function pairFilterQuery(filter: PairFilter): Record<string, string> {
  const query: Record<string, string> = {};
  if (filter.problemId) query.problemId = filter.problemId;
  if (filter.language) query.language = filter.language;
  if (filter.minPercent !== null) query.minPercent = String(filter.minPercent);
  if (filter.page > 1) query.page = String(filter.page);
  return query;
}

/** The request for the API: the threshold is sent as a 0-1 fraction, empty fields are left out. */
export function toPairsRequest(filter: PairFilter): PairsRequest {
  const request: PairsRequest = { page: filter.page };
  if (filter.problemId) request.problemId = filter.problemId;
  if (filter.language) request.language = filter.language;
  if (filter.minPercent !== null) request.minSimilarity = filter.minPercent / MAX_PERCENT;
  return request;
}

export const percentText = (similarity: number): string =>
  `${Math.round(similarity * MAX_PERCENT)}%`;

type Side = 'left' | 'right';

/** Each line of one side mapped to the index of the fragment that covers it. The first fragment wins an overlap. */
export function fragmentOfLine(fragments: SimilarityFragment[], side: Side): Map<number, number> {
  const fragmentOf = new Map<number, number>();
  fragments.forEach((fragment, index) => {
    const start = side === 'left' ? fragment.leftStart : fragment.rightStart;
    const end = side === 'left' ? fragment.leftEnd : fragment.rightEnd;
    for (let line = start; line <= end; line += 1) {
      if (!fragmentOf.has(line)) fragmentOf.set(line, index);
    }
  });
  return fragmentOf;
}

/** A submitted source as its lines; an empty (deleted) source has none, and a final newline ends the last line. */
export const sourceLines = (source: string): string[] =>
  source === '' ? [] : source.replace(/\n$/, '').split('\n');

/** The verdict badge of a stored result; an unknown or missing result has no badge. */
export function verdictOfResult(result: string | null): Verdict | null {
  if (result === null || !VERDICT_CODES.includes(result as SubmissionResult)) return null;
  const code = result as SubmissionResult;
  return { code, tone: VERDICT_TONES[code], labelKey: `verdicts.${code}` };
}

/** A submission that no longer exists keeps its side: no date and no source. */
export const isDeletedSide = (side: PairDetailSide): boolean =>
  side.date === null && side.source === '';

/** A line's element id, the target of the fragment list's scroll. */
export const lineIdOf = (side: Side, line: number): string => `${side}-line-${line}`;

export interface ProblemOption {
  id: string;
  code: string;
}

/** The problems a run compared, each once, in the run's order. */
export function problemOptionsOf(groups: SimilarityGroup[]): ProblemOption[] {
  const seen = new Map<string, ProblemOption>();
  for (const group of groups) {
    if (!seen.has(group.problemId))
      seen.set(group.problemId, { id: group.problemId, code: group.problemCode });
  }
  return [...seen.values()];
}

/** The engine families a run compared, each once, in the run's order. */
export const languagesOf = (groups: SimilarityGroup[]): string[] => [
  ...new Set(groups.map((group) => group.language)),
];
