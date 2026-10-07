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
const TONES: Record<VerdictCode, VerdictTone> = {
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
export const VERDICT_CODES = Object.keys(TONES) as VerdictCode[];

/** A finished submission shows its result (or its final status when it has none); an unfinished one its status. */
export function verdictOf({
  status,
  result,
}: {
  status: SubmissionStatus;
  result: SubmissionResult | null;
}): Verdict {
  const code: VerdictCode = FINISHED_STATUSES.includes(status) ? (result ?? status) : status;
  return { code, tone: TONES[code], labelKey: `verdicts.${code}` };
}
