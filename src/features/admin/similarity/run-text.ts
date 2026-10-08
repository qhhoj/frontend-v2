import { translate } from '@/i18n';
import type { SimilarityRun } from '@/api/types/similarity';
import { runDurationSeconds } from './similarity-runs';

/** A failed run names its reason after the word; every other status is the word alone. */
export const runStatusText = (run: SimilarityRun): string =>
  run.status === 'failed' && run.error
    ? `${translate('admin.similarity.status.failed')} · ${translate(`admin.similarity.runError.${run.error}`)}`
    : translate(`admin.similarity.status.${run.status}`);

/** A finished run's length, else the word that says why there is none. */
export const runDurationText = (run: SimilarityRun): string => {
  const seconds = runDurationSeconds(run);
  if (seconds === null) {
    return translate(
      run.status === 'running'
        ? 'admin.similarity.runs.running'
        : 'admin.similarity.runs.notStarted',
    );
  }
  return translate('admin.similarity.runs.duration', {
    minutes: Math.floor(seconds / 60),
    seconds: seconds % 60,
  });
};
