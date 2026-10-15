import { FINISHED_STATUSES } from '@/api/types/submissions';
import type { CaseStatus, SubmissionResult, SubmissionStatus } from '@/api/types/submissions';

export type VerdictTone = 'ac' | 'pc' | 'wa' | 'tle' | 'rte' | 'ce' | 'pending';
/** `PC` (partially correct) is not a judge status: the frontend derives it from an AC that earned less than its maximum. */
export const PARTIAL_CODE = 'PC';
export type VerdictCode = SubmissionResult | SubmissionStatus | typeof PARTIAL_CODE;
export interface Verdict {
  code: VerdictCode;
  tone: VerdictTone;
  labelKey: string;
}

/** Legacy colour groups (program spec): TLE/MLE amber, RTE/OLE/IR violet, CE and system outcomes slate. */
/** One tone per code: the single source for verdict colours (badges, chips, result bars). */
export const VERDICT_TONES: Record<VerdictCode, VerdictTone> = {
  AC: 'ac',
  PC: 'pc',
  WA: 'wa',
  TLE: 'tle',
  MLE: 'tle',
  OLE: 'rte',
  IR: 'rte',
  RTE: 'rte',
  CE: 'ce',
  IE: 'ce',
  AB: 'ce',
  SC: 'ce',
  RJ: 'ce',
  QU: 'pending',
  P: 'pending',
  G: 'pending',
  D: 'pending',
  PD: 'pending',
};
/** Tone classes shared by VerdictBadge and VerdictLabel: tokens only (lint:tokens). */
export const VERDICT_TONE_CLASSES: Record<VerdictTone, string> = {
  ac: 'bg-verdict-ac-bg text-verdict-ac',
  pc: 'bg-partial-bg-2 text-verdict-partial',
  wa: 'bg-verdict-wa-bg text-verdict-wa',
  tle: 'bg-verdict-tle-bg text-verdict-tle',
  rte: 'bg-verdict-rte-bg text-verdict-rte',
  ce: 'bg-verdict-ce-bg text-verdict-ce',
  pending: 'bg-verdict-pending-bg text-verdict-pending',
};
/** Custom properties of the verdict tones (tokens), for drawings that need a colour value (rings, strips). */
export const VERDICT_TONE_VARS: Record<VerdictTone, string> = {
  ac: '--qh-verdict-ac',
  pc: '--qh-verdict-partial',
  wa: '--qh-verdict-wa',
  tle: '--qh-verdict-tle',
  rte: '--qh-verdict-rte',
  ce: '--qh-verdict-ce',
  pending: '--qh-verdict-pending',
};
/** The solid verdict block of a submission row (white text on a saturated fill); pending keeps the soft tint. System outcomes (IE, AB) are the dark `sys` block. */
export type BlockTone = VerdictTone | 'sys';
const SYSTEM_CODES: readonly VerdictCode[] = ['IE', 'AB'];
export const BLOCK_TONE_CLASSES: Record<BlockTone, string> = {
  ac: 'bg-verdict-ac-solid text-on-verdict-solid',
  /** The partial ink is dark on light themes and pale on dark ones, so the text takes the card colour to stay readable on both. */
  pc: 'bg-verdict-partial text-surface-solid',
  wa: 'bg-verdict-wa-solid text-on-verdict-solid',
  tle: 'bg-verdict-tle-solid text-on-verdict-solid',
  rte: 'bg-verdict-rte-solid text-on-verdict-solid',
  ce: 'bg-verdict-ce-solid text-on-verdict-solid',
  sys: 'bg-verdict-sys-solid text-on-verdict-solid',
  pending: VERDICT_TONE_CLASSES.pending,
};
export const blockToneOf = ({ code, tone }: Verdict): BlockTone =>
  SYSTEM_CODES.includes(code) ? 'sys' : tone;
export const VERDICT_CODES = Object.keys(VERDICT_TONES) as VerdictCode[];

export const verdictOfCode = (code: VerdictCode): Verdict => ({
  code,
  tone: VERDICT_TONES[code],
  labelKey: `verdicts.${code}`,
});

/** A finished submission shows its result (or its final status when it has none); an unfinished one its status. */
export function verdictOf({
  status,
  result,
}: {
  status: SubmissionStatus;
  result: SubmissionResult | null;
}): Verdict {
  return verdictOfCode(FINISHED_STATUSES.includes(status) ? (result ?? status) : status);
}

/**
 * The one partial rule: the judge accepted it (AC) but it earned less than its maximum. A test compares its points with
 * its total, a submission its points with the problem's points. Unknown points or maximum are never partial.
 */
export function isPartial(
  code: VerdictCode,
  earned: number | null,
  max: number | null | undefined,
): boolean {
  return code === 'AC' && earned !== null && max !== null && max !== undefined && earned < max;
}

/** The verdict of one submission as shown to people: `verdictOf`, with a partial AC shown as PC. Not for counts or stats. */
export function submissionVerdictOf(row: {
  status: SubmissionStatus;
  result: SubmissionResult | null;
  points: number | null;
  problem: { points: number } | null;
}): Verdict {
  const verdict = verdictOf(row);
  return isPartial(verdict.code, row.points, row.problem?.points)
    ? verdictOfCode(PARTIAL_CODE)
    : verdict;
}

/** The verdict of one test (or subtask summary): its status, with a partial AC shown as PC. */
export function caseVerdictOf(testCase: {
  status: CaseStatus;
  points: number;
  total: number;
}): Verdict {
  return verdictOfCode(
    isPartial(testCase.status, testCase.points, testCase.total) ? PARTIAL_CODE : testCase.status,
  );
}
