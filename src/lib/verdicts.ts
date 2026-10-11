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
/** Custom properties of the verdict tones (tokens), for drawings that need a colour value (rings, strips). */
export const VERDICT_TONE_VARS: Record<VerdictTone, string> = {
  ac: '--qh-verdict-ac',
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
