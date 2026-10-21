import { computed, onBeforeUnmount, ref, watch } from 'vue';
import type { Ref } from 'vue';
import type { ImportJob } from '@/api/types/problem-imports';
import { phaseOf } from './import-job';
import type { PollStop } from './import-job';
import { ImportPoller } from './import-poller';

/**
 * Polls the job every 2 s until it is completed or failed. A 404, 401/403 or the unknown state stops it at once;
 * network, 429 and 5xx errors are retried with backoff, then it stops as `gaveUp` until `recheck`. Stops on unmount too.
 */
export function useImportJob(jobId: Ref<string | null>) {
  const job = ref<ImportJob | null>(null);
  const failure = ref<unknown>(null);
  const stop = ref<PollStop | null>(null);
  const phase = computed(() => (job.value ? phaseOf(job.value.state) : null));
  const poller = new ImportPoller({ job, failure, stop });

  watch(jobId, (id) => poller.start(id), { immediate: true });
  onBeforeUnmount(() => poller.dispose());
  /** Polls again after it stopped; the last job seen stays shown meanwhile. */
  const recheck = () => poller.resume(jobId.value);
  return { job, phase, failure, stop, recheck };
}
