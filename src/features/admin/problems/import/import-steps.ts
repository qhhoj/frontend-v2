import type { ImportJob } from '@/api/types/problem-imports';
import type { PolygonSyncStep } from '@/api/types/polygon';
import { formatFileSize } from '@/lib/format';

export type ImportStepKey = ImportJob['step'];
/** The steps a job passes through while it runs (`queued` included); `done` and `failed` end it. */
export type RunningStep = Exclude<ImportStepKey, 'done' | 'failed'>;
/** Where the job comes from: only a Polygon import or sync downloads the package first. */
export type ImportSource = 'zip' | 'polygon';
export type StepStatus = 'done' | 'current' | 'pending' | 'failed';
/** A row before the end: a running step, or `checking` (the checks before the download), which a job never reports as running. */
export type StepRow = RunningStep | 'checking';
export interface ShownStep {
  key: StepRow | 'end';
  status: StepStatus;
}

const ROWS: Record<ImportSource, StepRow[]> = {
  zip: ['queued', 'statements', 'tests'],
  polygon: ['queued', 'checking', 'downloading', 'statements', 'generating', 'tests'],
};

export const isRunningStep = (step: ImportStepKey): step is RunningStep =>
  step !== 'done' && step !== 'failed';

/** The row a failed job's `failedStep` belongs to: the database write and the file moves after it fail the end, every running row having passed. */
const FAILED_ROW: Record<PolygonSyncStep, StepRow | 'end'> = {
  checking: 'checking',
  downloading: 'downloading',
  statements: 'statements',
  generating: 'generating',
  tests: 'tests',
  saving: 'end',
  finishing: 'end',
};
export const failedRowOf = (step: PolygonSyncStep) => FAILED_ROW[step];

/** Where a failure sits in these rows: a list without the checks row (a zip import) fails them on its first row. */
function failedIndexOf(rows: StepRow[], failedAt: StepRow | 'end' | null) {
  if (failedAt === 'end') return rows.length;
  if (failedAt === 'checking' && !rows.includes('checking')) return 0;
  return failedAt ? rows.indexOf(failedAt) : -1;
}

function failedSteps(rows: StepRow[], failedAt: StepRow | 'end' | null): ShownStep[] {
  const failedIndex = failedIndexOf(rows, failedAt);
  return [
    ...rows.map((key, index): ShownStep => {
      if (index < failedIndex) return { key, status: 'done' };
      return { key, status: index === failedIndex ? 'failed' : 'pending' };
    }),
    { key: 'end', status: 'failed' },
  ];
}

/**
 * The rows of the progress list for a job's `step`. For a failed job `failedAt` is the row it stopped at (from its
 * `failedStep`, else the last running step this page saw): that row fails and the rows before it are done; unknown, only
 * the end fails.
 */
export function importStepsOf(
  source: ImportSource,
  step: ImportStepKey,
  failedAt: StepRow | 'end' | null = null,
): ShownStep[] {
  const rows = ROWS[source];
  if (step === 'failed') return failedSteps(rows, failedAt);
  if (step === 'done')
    return [
      ...rows.map((key): ShownStep => ({ key, status: 'done' })),
      { key: 'end', status: 'done' },
    ];
  const currentIndex = rows.indexOf(step);
  return [
    ...rows.map((key, index): ShownStep => ({
      key,
      status: index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'pending',
    })),
    { key: 'end', status: 'pending' },
  ];
}

/** Downloaded bytes of the running download, with the share when Polygon sent the size; null for the other steps. */
export function downloadProgressOf(job: ImportJob | null) {
  const progress = job?.progress;
  if (progress?.step !== 'downloading' || progress.done === null) return null;
  const share =
    progress.total && progress.total > 0 ? Math.min(1, progress.done / progress.total) : null;
  return { done: progress.done, total: progress.total, share };
}

/** The downloaded bytes as text (`1.2 MB / 40.0 MB`, or the bytes alone without a size); '' outside the download. */
export function downloadTextOf(job: ImportJob | null): string {
  const download = downloadProgressOf(job);
  if (!download) return '';
  const done = formatFileSize(download.done);
  return download.total === null ? done : `${done} / ${formatFileSize(download.total)}`;
}
