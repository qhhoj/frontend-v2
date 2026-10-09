import { computed, onBeforeUnmount, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { fetchImportJob } from '@/api/problem-imports.api';
import type { ImportJob } from '@/api/types/problem-imports';
import { IMPORT_POLL_MS, isFinal, phaseOf } from './import-job';

/** Polls the job every 2 s until it is completed or failed; stops when the page goes away. */
export function useImportJob(jobId: Ref<string | null>) {
  const job = ref<ImportJob | null>(null);
  const failure = ref<unknown>(null);
  const phase = computed(() => (job.value ? phaseOf(job.value.state) : null));
  let timer: ReturnType<typeof setTimeout> | undefined;
  let isStopped = false;

  async function poll(id: string) {
    try {
      job.value = await fetchImportJob(id);
      failure.value = null;
    } catch (error) {
      failure.value = error;
    }
    if (!isStopped && !(phase.value && isFinal(phase.value)))
      timer = setTimeout(() => void poll(id), IMPORT_POLL_MS);
  }

  watch(jobId, (id) => {
    clearTimeout(timer);
    job.value = null;
    if (id) void poll(id);
  });
  onBeforeUnmount(() => {
    isStopped = true;
    clearTimeout(timer);
  });
  return { job, phase, failure };
}
