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
type SyncedSetting = Schemas['SyncedSetting'];
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

/** A setting a sync kept as edited on QHHOJ, beside what the package has. */
const keptNote = (polygon: string | null) =>
  polygon ? translate(`${LINK}.summary.kept`, { polygon }) : translate(`${LINK}.localEdits.kept`);

/**
 * The checker as stored: kept by a sync, or mapped from the package. An interactive problem's checker runs on what the
 * interactor wrote, unless a sync kept a local grader without one (`checkerIgnored`): then the interactor alone decides.
 */
function checkerRow(summary: Summary, isKept: boolean): SummaryRow {
  if (summary.checkerIgnored) {
    const value = translate(`${LINK}.summary.interactorOnly`);
    return { key: 'checker', value, note: translate(`${LINK}.summary.checkerIgnored`) };
  }
  const name = checkerName(summary.checker);
  const mapped = summary.polygonChecker && !isKept ? `${summary.polygonChecker} → ${name}` : name;
  const value = summary.interactive
    ? translate(`${LINK}.summary.interactive`, { checker: mapped })
    : mapped;
  return { key: 'checker', value, note: isKept ? keptNote(summary.polygonChecker) : null };
}

function testsRow({ tests, cases, batches }: Summary): SummaryRow {
  const parts = [translate(`${LINK}.summary.tests`, { count: tests })];
  if (cases !== tests) parts.push(translate(`${LINK}.summary.cases`, { count: cases }));
  if (batches > 0) parts.push(translate(`${LINK}.summary.batches`, { count: batches }));
  return { key: 'tests', value: parts.join(' · '), note: null };
}

function limitRow(
  key: SummaryRow['key'],
  limit: Limit,
  format: (n: number) => string,
  isKept: boolean,
): SummaryRow {
  if (limit.polygon === limit.applied) return { key, value: format(limit.applied), note: null };
  if (isKept) return { key, value: format(limit.applied), note: keptNote(format(limit.polygon)) };
  const way = limit.applied < limit.polygon ? 'lowered' : 'raised';
  const note = translate(`${LINK}.summary.${way}`, { polygon: format(limit.polygon) });
  return { key, value: format(limit.applied), note };
}

/**
 * "Khác gì so với Polygon": the checker mapping, the tests as judged, and each limit with its clamp; a setting in `kept`
 * (a sync kept it as edited on QHHOJ) says so instead.
 */
export const summaryRowsOf = (
  summary: Summary,
  kept: readonly SyncedSetting[] = [],
): SummaryRow[] => [
  checkerRow(summary, kept.includes('checker')),
  testsRow(summary),
  limitRow('time', summary.timeLimit, formatTimeLimit, kept.includes('timeLimit')),
  limitRow('memory', summary.memoryLimit, formatMemoryLimit, kept.includes('memoryLimit')),
];

/** The order settings are named in, as the data tab draws them. */
const SETTING_ORDER: readonly SyncedSetting[] = [
  'timeLimit',
  'memoryLimit',
  'partial',
  'checker',
  'grader',
];
export interface LocalEditsRow {
  kind: 'kept' | 'updated';
  /** The settings' names, comma-separated. */
  names: string;
}

/** What a sync did with the settings a setter may edit on QHHOJ: kept, then taken from the package; an empty list has no row. */
export function localEditsRowsOf(localEdits: Schemas['LocalEditsResponse']): LocalEditsRow[] {
  const namesOf = (settings: readonly SyncedSetting[]) =>
    SETTING_ORDER.filter((setting) => settings.includes(setting))
      .map((setting) => translate(`${LINK}.localEdits.settings.${setting}`))
      .join(', ');
  const rows: LocalEditsRow[] = [
    { kind: 'kept', names: namesOf(localEdits.kept) },
    { kind: 'updated', names: namesOf(localEdits.updated) },
  ];
  return rows.filter((row) => row.names);
}

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
