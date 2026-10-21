import type { Schemas } from '@/api/schemas';
import type { ImportJob } from '@/api/types/problem-imports';
import { i18n, translate } from '@/i18n';
import { formatMemoryLimit, formatTimeLimit } from '@/lib/format';
import type { ImportPhase, PollStop } from '../import/import-job';
import { downloadTextOf } from '../import/import-steps';
import type { ImportErrorKind } from './polygon-import-errors';

/**
 * What the progress step leads with (option B): `waiting` before the first answer, `queued`, `running`, `done`,
 * `attention` (imported, a file step after the write failed), `failed`, `lost` (polling gave up: "Kiểm tra lại"),
 * `gone` (the job cannot be read: expired, someone else's, unknown to the queue).
 */
export type OutcomeKind =
  'waiting' | 'queued' | 'running' | 'done' | 'attention' | 'failed' | 'lost' | 'gone';

const PHASE_KINDS: Record<ImportPhase, OutcomeKind> = {
  queued: 'queued',
  running: 'running',
  done: 'done',
  failed: 'failed',
};

/** A stop outranks the last job seen: what the page knows now is that it cannot tell. */
export function outcomeKindOf(
  phase: ImportPhase | null,
  job: ImportJob | null,
  stop: PollStop | null,
): OutcomeKind {
  if (stop) return stop === 'gaveUp' ? 'lost' : 'gone';
  if (!job || !phase) return 'waiting';
  if (phase === 'done' && job.result?.attention) return 'attention';
  return PHASE_KINDS[phase];
}

const LINK = 'admin.polygonLink.progress';

/** Where a waiting job stands: its place, then how many jobs are ahead of it. */
export function queueLinesOf(position: number | null) {
  if (position === null) return { place: translate(`${LINK}.queue.waiting`), ahead: '' };
  return {
    place: translate(`${LINK}.queue.place`, { position }),
    ahead:
      position <= 1
        ? translate(`${LINK}.queue.noneAhead`)
        : translate(`${LINK}.queue.ahead`, { count: position - 1 }),
  };
}

/** How far the running step is: the downloaded bytes, or the tests generated when the judge reports them. */
function stepCountOf(job: ImportJob): string {
  const download = downloadTextOf(job);
  if (download) return download;
  const progress = job.progress;
  if (progress?.step !== 'generating' || progress.done === null || progress.total === null)
    return '';
  return `${progress.done}/${progress.total}`;
}

/** The running step in a few words, with how far it is. */
export function runningLineOf(job: ImportJob): string {
  const step = translate(`admin.polygon.progress.steps.${job.step}`);
  const count = stepCountOf(job);
  return count ? `${step} ${count}` : step;
}

type Summary = Schemas['ImportSummaryResponse'];
type Limit = Schemas['ClampedLimitResponse'];
export interface SummaryRow {
  key: 'checker' | 'tests' | 'time' | 'memory';
  value: string;
  /** Where QHHOJ differs from the package (a clamped limit, a checker not run); null when it does not. */
  note: string | null;
}

/** A site checker's name as the data tab says it; a name this page does not know as it is. */
function checkerName(checker: Summary['checker']): string {
  if (checker === 'bridged') return translate('admin.problems.data.checkers.bridged');
  const key = `admin.problems.data.config.stock.${checker}.label`;
  return i18n.global.te(key) ? translate(key) : checker;
}

function checkerRow(summary: Summary): SummaryRow {
  if (summary.interactive) {
    const value = translate(`${LINK}.summary.interactive`);
    const note = summary.checkerIgnored ? translate(`${LINK}.summary.checkerIgnored`) : null;
    return { key: 'checker', value, note };
  }
  const name = checkerName(summary.checker);
  const value = summary.polygonChecker ? `${summary.polygonChecker} → ${name}` : name;
  return { key: 'checker', value, note: null };
}

function testsRow({ tests, cases, batches }: Summary): SummaryRow {
  const parts = [translate(`${LINK}.summary.tests`, { count: tests })];
  if (cases !== tests) parts.push(translate(`${LINK}.summary.cases`, { count: cases }));
  if (batches > 0) parts.push(translate(`${LINK}.summary.batches`, { count: batches }));
  return { key: 'tests', value: parts.join(' · '), note: null };
}

function limitRow(key: SummaryRow['key'], limit: Limit, format: (n: number) => string): SummaryRow {
  if (limit.polygon === limit.applied) return { key, value: format(limit.applied), note: null };
  const way = limit.applied < limit.polygon ? 'lowered' : 'raised';
  const note = translate(`${LINK}.summary.${way}`, { polygon: format(limit.polygon) });
  return { key, value: format(limit.applied), note };
}

/** "Khác gì so với Polygon": the checker mapping, the tests as judged, and each limit with its clamp. */
export const summaryRowsOf = (summary: Summary): SummaryRow[] => [
  checkerRow(summary),
  testsRow(summary),
  limitRow('time', summary.timeLimit, formatTimeLimit),
  limitRow('memory', summary.memoryLimit, formatMemoryLimit),
];

/** The outcome's one primary action; null leaves only "Nhập bài khác". */
export type OutcomeAction = 'open' | 'resync' | 'retry' | 'edit' | 'syncOptions' | 'recheck' | null;

/** What this page can do for the job: retry it (its body is known), edit its options (its form is), sync the problem. */
export interface OutcomeAbilities {
  retry: boolean;
  edit: boolean;
  sync: boolean;
}

/** Why the job failed, as far as its action goes; a sync runs on the link's saved options, not on an import's form. */
export interface OutcomeFailure {
  retryable: boolean;
  kind: ImportErrorKind;
  isSync: boolean;
}

/** A failed sync: synced again when it may pass by itself, else its options changed on the problem's Polygon card. */
function syncFailedActionOf(failure: OutcomeFailure, can: OutcomeAbilities): OutcomeAction {
  if (!can.sync) return null;
  if (failure.retryable) return 'resync';
  return failure.kind === 'options' ? 'syncOptions' : null;
}

/** A failure: try again only when it may pass by itself, else back to the options when they or the code caused it. */
function failedActionOf(failure: OutcomeFailure, can: OutcomeAbilities): OutcomeAction {
  if (failure.isSync) return syncFailedActionOf(failure, can);
  if (failure.retryable) return can.retry ? 'retry' : null;
  const isSetup = failure.kind === 'options' || failure.kind === 'target';
  return isSetup && can.edit ? 'edit' : null;
}

export function outcomeActionOf(
  kind: OutcomeKind,
  failure: OutcomeFailure,
  can: OutcomeAbilities,
): OutcomeAction {
  switch (kind) {
    case 'done':
      return 'open';
    case 'attention':
      return can.sync ? 'resync' : 'open';
    case 'failed':
      return failedActionOf(failure, can);
    case 'lost':
      return 'recheck';
    default:
      return null;
  }
}
