import { translate } from '@/i18n';
import type { SimilarityRun } from '@/api/types/similarity';
import { runDurationSeconds } from './similarity-runs';

const SECONDS_PER_MINUTE = 60;

/** A failed run names its reason after the word; every other status is the word alone. */
export const runStatusText = (run: SimilarityRun): string =>
  run.status === 'failed' && run.error
    ? `${translate('admin.similarity.status.failed')} · ${translate(`admin.similarity.runError.${run.error}`)}`
    : translate(`admin.similarity.status.${run.status}`);

/** A run's length: seconds under a minute, else minutes and seconds. Without a finish time, the status says why. */
export const runDurationText = (run: SimilarityRun): string => {
  const seconds = runDurationSeconds(run);
  if (seconds === null) return unfinishedDurationText(run);
  if (seconds < SECONDS_PER_MINUTE) return translate('admin.similarity.runs.seconds', { seconds });
  return translate('admin.similarity.runs.duration', {
    minutes: Math.floor(seconds / SECONDS_PER_MINUTE),
    seconds: seconds % SECONDS_PER_MINUTE,
  });
};

/** A run with no finish time: still going, not yet started, or ended without a usable time (never "not started"). */
const unfinishedDurationText = (run: SimilarityRun): string => {
  if (run.status === 'running') return translate('admin.similarity.runs.running');
  if (run.status === 'queued') return translate('admin.similarity.runs.notStarted');
  return '—';
};
