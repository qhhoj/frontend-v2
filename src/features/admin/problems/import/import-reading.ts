import type { ImportJob } from '@/api/types/problem-imports';
import { translate } from '@/i18n';
import type { Locale } from '@/i18n';
import { formatDuration } from '@/lib/format';
import { formatClock, formatDate } from '@/lib/format-date';
import { importErrorOf } from './import-errors';
import type { ImportErrorKind, ImportErrorText } from './import-errors';
import type { ImportPhase, PollStop } from './import-job';
import { downloadTextOf } from './import-steps';

/**
 * The one reading of an import job, for every import path (zip, Polygon import, sync): `readImportJob` turns the job, the
 * poll stop and the purpose into the outcome kind, title, cause and fix, status line and the one next action. The views
 * only render it; Polygon-only facts (the conversion summary, the local edits kept) stay in the Polygon view.
 *
 * What the progress view leads with: `waiting` before the first answer, `queued`, `running`, `done`,
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

/** Which import the job is: a zip upload, a Polygon import, or a sync of a linked problem. */
export type ImportPurpose = 'zip' | 'polygon' | 'sync';

export interface ImportReadingInput {
  /** The view reading it; a Polygon job whose `purpose` is `sync` is read as a sync. */
  source: 'zip' | 'polygon';
  job: ImportJob | null;
  phase: ImportPhase | null;
  stop: PollStop | null;
  /** The problem's code: the job's, else the one the form named; empty before anything names it. */
  code: string;
  /** When the job was last seen (ISO): the "Chưa rõ trạng thái" line says how old its step is. */
  lastSeenAt: string;
  locale: Locale;
  can: OutcomeAbilities;
}

export interface ImportReading {
  kind: OutcomeKind;
  purpose: ImportPurpose;
  title: string;
  /** The status line under the title. */
  line: string;
  /** Extra line while queued or running. */
  hint: string;
  /** Of a failed job its cause and fix; of an `attention` job what to repair; else empty. */
  cause: string;
  fix: string;
  /** The converter's own words: the only specifics of a refused package or checker; empty unless failed. */
  detail: string;
  action: OutcomeAction;
}

const STEPS = 'admin.polygon.progress';

const purposeOf = (source: ImportReadingInput['source'], job: ImportJob | null): ImportPurpose => {
  if (source === 'zip') return 'zip';
  return job?.purpose === 'sync' ? 'sync' : 'polygon';
};

/** The zip view's headings: its own words, and the heading follows the end (never "Đang nhập" after a failure). */
function zipTitleOf(kind: OutcomeKind, code: string): string {
  if (kind === 'waiting' || kind === 'lost' || kind === 'gone')
    return translate(`${LINK}.outcome.unnamed.${kind}`);
  if (kind === 'failed') return translate(`${STEPS}.titleFailed`, { code });
  const isEnded = kind === 'done' || kind === 'attention';
  return translate(`${STEPS}.${isEnded ? 'titleDone' : 'title'}`, { code });
}

/** Kinds that can come before any answer (after a reload), when nothing names the problem yet. */
const UNNAMED: ReadonlySet<OutcomeKind> = new Set(['waiting', 'lost', 'gone']);

function titleOf(purpose: ImportPurpose, kind: OutcomeKind, code: string): string {
  if (purpose === 'zip') return zipTitleOf(kind, code);
  if (!code && UNNAMED.has(kind)) return translate(`${LINK}.outcome.unnamed.${kind}`);
  return translate(`${LINK}.outcome.${purpose === 'sync' ? 'sync' : 'import'}.${kind}`, { code });
}

function finishedLine(job: ImportJob | null, locale: Locale): string {
  const { createdAt, finishedAt } = job ?? {};
  if (!createdAt || !finishedAt) return '';
  const seconds = (Date.parse(finishedAt) - Date.parse(createdAt)) / 1000;
  const date = formatDate(finishedAt, 'datetime', locale);
  return translate(`${LINK}.finished`, { date, duration: formatDuration(seconds) });
}

function failedLine(job: ImportJob | null): string {
  const step = job?.failedStep;
  if (!step) return '';
  const name = translate(`${STEPS}.failedSteps.${step}`);
  return translate(`${STEPS}.stoppedAt`, { step: name });
}

function lastSeenLine(input: ImportReadingInput): string {
  if (!input.job) return '';
  const step = runningLineOf(input.job);
  return translate(`${LINK}.lastSeen`, { step, time: formatClock(input.lastSeenAt) });
}

/** Why polling stopped; the zip view has no "check again", so for it giving up reads like any other stop. */
const stoppedLine = (stop: PollStop | null) => (stop ? translate(`${STEPS}.stopped.${stop}`) : '');

function lineOf(input: ImportReadingInput, kind: OutcomeKind, attention: ImportErrorText): string {
  const { job, stop, source } = input;
  switch (kind) {
    case 'queued':
      return queueLinesOf(job?.queuePosition ?? null).place;
    case 'running':
      return job ? runningLineOf(job) : '';
    case 'done':
      return finishedLine(job, input.locale);
    case 'attention':
      return attention.title;
    case 'failed':
      return failedLine(job);
    case 'lost':
      return source === 'zip' ? stoppedLine(stop) : lastSeenLine(input);
    case 'gone':
      return stoppedLine(stop);
    default:
      return '';
  }
}

function hintOf(kind: OutcomeKind, job: ImportJob | null): string {
  if (kind === 'queued') return queueLinesOf(job?.queuePosition ?? null).ahead;
  if (kind !== 'running') return '';
  return translate(`${LINK}.hint.${job?.step === 'generating' ? 'generating' : 'running'}`);
}

/** The converter's own words, shown only when the code says nothing specific (`other`, and not the generic `import_failed`). */
function detailOf(job: ImportJob | null, kind: ImportErrorKind): string {
  return kind === 'other' && job?.errorCode !== 'import_failed' ? (job?.error ?? '') : '';
}

export function readImportJob(input: ImportReadingInput): ImportReading {
  const { job, phase, stop, code, source, can } = input;
  const kind = outcomeKindOf(phase, job, stop);
  const purpose = purposeOf(source, job);
  const error = importErrorOf(job?.errorCode ?? null, job?.errorParams ?? null);
  const attention = importErrorOf(
    'imported_needs_attention',
    job?.result?.attention?.params ?? null,
  );
  const shown = kind === 'attention' ? attention : kind === 'failed' ? error : null;
  const failure = {
    retryable: job?.retryable ?? false,
    kind: error.kind,
    isSync: purpose === 'sync',
  };
  return {
    kind,
    purpose,
    title: titleOf(purpose, kind, code),
    line: lineOf(input, kind, attention),
    hint: hintOf(kind, job),
    cause: shown?.title ?? '',
    fix: shown?.fix ?? '',
    detail: kind === 'failed' ? detailOf(job, error.kind) : '',
    action: outcomeActionOf(kind, failure, can),
  };
}
