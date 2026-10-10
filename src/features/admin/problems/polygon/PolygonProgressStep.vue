<script setup lang="ts">
import { computed, toRef } from 'vue';
import { startPolygonLinkImport } from '@/api/polygon.api';
import type { PolygonImportBody, PolygonProblem } from '@/api/types/polygon';
import AdminStatus from '../../ui/AdminStatus.vue';
import { ADMIN_BUTTON_CLASS, ADMIN_PRIMARY_CLASS } from '../../ui/classes';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import ImportProgress from '../import/ImportProgress.vue';
import { importRefusalText } from '../import/import-refusal';
import { useImportJob } from '../import/use-import-job';

/** Step 3: follows the job; a failed one can be started again with the same options while this page still has them. */
const props = defineProps<{
  jobId: string;
  problem: PolygonProblem | null;
  body: PolygonImportBody | null;
}>();
const emit = defineEmits<{ started: [jobId: string, body: PolygonImportBody]; restart: [] }>();
const { job, phase, failure: pollFailure, stop } = useImportJob(toRef(props, 'jobId'));
const code = computed(() => job.value?.result?.code ?? props.body?.code ?? '');
const isFinished = computed(
  () => phase.value === 'done' || phase.value === 'failed' || !!stop.value,
);

const retry = useAdminMutation({
  mutate: ({ problem, body }: { problem: PolygonProblem; body: PolygonImportBody }) =>
    startPolygonLinkImport(problem.id, body),
  onDone: ({ jobId }, { body }) => emit('started', jobId, body),
});
const retryRefusal = computed(() =>
  retry.failure.value ? importRefusalText(retry.failure.value) : null,
);
</script>

<template>
  <div class="flex flex-col gap-4">
    <ImportProgress
      source="polygon"
      :code="code"
      :phase="phase"
      :job="job"
      :poll-failure="pollFailure"
      :stop="stop"
    >
      <template #actions>
        <button
          v-if="phase === 'failed' && problem && body"
          type="button"
          :class="ADMIN_PRIMARY_CLASS"
          :aria-busy="retry.isPending.value || undefined"
          @click="retry.run({ problem, body })"
        >
          {{ $t('admin.polygonLink.progress.retry') }}
        </button>
        <button
          v-if="isFinished"
          type="button"
          :class="ADMIN_BUTTON_CLASS"
          @click="emit('restart')"
        >
          {{ $t('admin.polygonLink.progress.another') }}
        </button>
      </template>
    </ImportProgress>
    <AdminStatus v-if="retryRefusal" kind="refused" :text="retryRefusal" />
  </div>
</template>
