import type { ImportJob } from '@/api/types/problem-imports';
import type { PolygonSyncStep } from '@/api/types/polygon';

export type ImportStepKey = ImportJob['step'];
/** The steps a job passes through while it runs (`queued` included); `done` and `failed` end it. */
export type RunningStep = Exclude<ImportStepKey, 'done' | 'failed'>;
/** Where the job comes from: only a Polygon import or sync downloads the package first. */
export type ImportSource = 'zip' | 'polygon';
export type StepStatus = 'done' | 'current' | 'pending' | 'failed';
export interface ShownStep {
  key: RunningStep | 'end';
  status: StepStatus;
}

const RUNNING_STEPS: Record<ImportSource, RunningStep[]> = {
  zip: ['queued', 'statements', 'tests'],
  polygon: ['queued', 'downloading', 'statements', 'tests'],
};

export const isRunningStep = (step: ImportStepKey): step is RunningStep =>
  step !== 'done' && step !== 'failed';

/** The row a failed job's `failedStep` belongs to: the checks before any work fail the queued row; the database write and the file moves after it fail the end, every running row having passed. */
const FAILED_ROW: Record<PolygonSyncStep, RunningStep | 'end'> = {
  checking: 'queued',
  downloading: 'downloading',
  statements: 'statements',
  tests: 'tests',
  saving: 'end',
  finishing: 'end',
};
export const failedRowOf = (step: PolygonSyncStep) => FAILED_ROW[step];

function failedSteps(running: RunningStep[], failedAt: RunningStep | 'end' | null): ShownStep[] {
  const failedIndex =
    failedAt === 'end' ? running.length : failedAt ? running.indexOf(failedAt) : -1;
  return [
    ...running.map((key, index): ShownStep => {
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
  failedAt: RunningStep | 'end' | null = null,
): ShownStep[] {
  const running = RUNNING_STEPS[source];
  if (step === 'failed') return failedSteps(running, failedAt);
  if (step === 'done')
    return [
      ...running.map((key): ShownStep => ({ key, status: 'done' })),
      { key: 'end', status: 'done' },
    ];
  const currentIndex = running.indexOf(step);
  return [
    ...running.map((key, index): ShownStep => ({
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
