<script setup lang="ts">
import { computed, toRef } from 'vue';
import type { ImportJob } from '@/api/types/problem-imports';
import AdminStatus from '../../ui/AdminStatus.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { CARD, buttonClass } from '../../ui/controls';
import ImportStepList from './ImportStepList.vue';
import type { ImportPhase, PollStop } from './import-job';
import { useImportSteps } from './use-import-steps';

/** The zip import's job: its steps from its `step`, then the end: link or reason. */
const props = defineProps<{
  code: string;
  phase: ImportPhase | null;
  job: ImportJob | null;
  pollFailure: unknown;
  stop: PollStop | null;
}>();

const steps = useImportSteps('zip', toRef(props, 'job'));
const failedStep = computed(() => props.job?.failedStep ?? null);
const isFinished = computed(() => props.phase === 'done' || props.phase === 'failed');
const failedText = computed(() => props.job?.error || '');
</script>

<template>
  <section
    :class="[CARD, 'flex flex-col gap-4 p-4 md:p-5']"
    aria-labelledby="import-progress-title"
  >
    <h2 id="import-progress-title" class="font-display text-base font-semibold">
      {{ $t('admin.polygon.progress.title', { code }) }}
    </h2>
    <p v-if="job" class="text-sm text-muted">
      <template v-if="!isFinished">{{ $t('admin.polygon.progress.runningHint') }}</template>
    </p>

    <ImportStepList :steps="steps" :job="job" />

    <AdminStatus
      v-if="phase === 'done' && job?.result"
      kind="done"
      :text="$t('admin.polygon.progress.doneText')"
    />
    <AdminStatus
      v-if="phase === 'failed'"
      kind="refused"
      :text="failedText || $t('admin.polygon.progress.failed')"
    />
    <p v-if="phase === 'failed' && failedStep" class="text-sm text-muted" data-testid="failed-step">
      {{
        $t('admin.polygon.progress.stoppedAt', {
          step: $t(`admin.polygon.progress.failedSteps.${failedStep}`),
        })
      }}
    </p>
    <AdminStatus v-if="stop" kind="refused" :text="$t(`admin.polygon.progress.stopped.${stop}`)" />
    <p v-else-if="pollFailure" class="text-sm text-negative">
      {{ $t('admin.polygon.progress.pollFailed') }} {{ failureTextOf(pollFailure) }}
    </p>
    <div class="flex flex-wrap gap-2 empty:hidden">
      <RouterLink
        v-if="phase === 'done' && job?.result"
        :to="{ name: 'admin-problemGeneral', params: { code: job.result.code } }"
        :class="buttonClass('primary')"
        >{{ $t('admin.polygon.progress.open', { code: job.result.code }) }}</RouterLink
      >
      <slot name="actions" :phase="phase" />
    </div>
  </section>
</template>
