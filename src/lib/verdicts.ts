import { FINISHED_STATUSES } from '@/api/types/submissions';
import type { SubmissionResult, SubmissionStatus } from '@/api/types/submissions';

export type VerdictTone = 'ac' | 'wa' | 'tle' | 'rte' | 'ce' | 'pending';
export type VerdictCode = SubmissionResult | SubmissionStatus;
export interface Verdict {
  code: VerdictCode;
  tone: VerdictTone;
  labelKey: string;
}

/** Legacy colour groups (program spec): TLE/MLE amber, RTE/OLE/IR violet, CE and system outcomes slate. */
/** One tone per code: the single source for verdict colours (badges, chips, result bars). */
export const VERDICT_TONES: Record<VerdictCode, VerdictTone> = {
  AC: 'ac',
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
  wa: 'bg-verdict-wa-bg text-verdict-wa',
  tle: 'bg-verdict-tle-bg text-verdict-tle',
  rte: 'bg-verdict-rte-bg text-verdict-rte',
  ce: 'bg-verdict-ce-bg text-verdict-ce',
  pending: 'bg-verdict-pending-bg text-verdict-pending',
};
export const VERDICT_CODES = Object.keys(VERDICT_TONES) as VerdictCode[];

/** A finished submission shows its result (or its final status when it has none); an unfinished one its status. */
export function verdictOf({
  status,
  result,
}: {
  status: SubmissionStatus;
  result: SubmissionResult | null;
}): Verdict {
  const code: VerdictCode = FINISHED_STATUSES.includes(status) ? (result ?? status) : status;
  return { code, tone: VERDICT_TONES[code], labelKey: `verdicts.${code}` };
}
