import { computed, ref, watch } from 'vue';
import type { Ref } from 'vue';
import type { ImportJob } from '@/api/types/problem-imports';
import { failedRowOf, importStepsOf, isRunningStep } from './import-steps';
import type { ImportSource, RunningStep } from './import-steps';

/**
 * The job's rows from its `step`. A job that failed before the server recorded `failedStep` failed at the last running
 * step seen here.
 */
export function useImportSteps(source: ImportSource, job: Ref<ImportJob | null>) {
  const lastRunningStep = ref<RunningStep | null>(null);
  watch(
    () => job.value?.step,
    (step) => {
      if (step && isRunningStep(step)) lastRunningStep.value = step;
    },
    { immediate: true },
  );
  return computed(() => {
    const failedStep = job.value?.failedStep;
    return importStepsOf(
      source,
      job.value?.step ?? 'queued',
      failedStep ? failedRowOf(failedStep) : lastRunningStep.value,
    );
  });
}
