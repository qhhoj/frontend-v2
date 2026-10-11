<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Check, X } from 'lucide-vue-next';
import type { ImportJob } from '@/api/types/problem-imports';
import { formatFileSize } from '@/lib/format';
import AdminBit from '../../shell/AdminBit.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { ADMIN_PRIMARY_CLASS } from '../../ui/classes';
import type { ImportPhase, PollStop } from './import-job';
import { downloadProgressOf, failedRowOf, importStepsOf, isRunningStep } from './import-steps';
import type { ImportSource, RunningStep, StepStatus } from './import-steps';

/** The job's steps from its `step` (a zip import has no download), the download bytes, and the end: link or reason. */
const props = withDefaults(
  defineProps<{
    code: string;
    phase: ImportPhase | null;
    job: ImportJob | null;
    pollFailure: unknown;
    stop: PollStop | null;
    source?: ImportSource;
  }>(),
  { source: 'zip' },
);

/** A job that failed before the server recorded `failedStep`: the last running step seen here is where it failed. */
const lastRunningStep = ref<RunningStep | null>(null);
watch(
  () => props.job?.step,
  (step) => {
    if (step && isRunningStep(step)) lastRunningStep.value = step;
  },
  { immediate: true },
);
const failedStep = computed(() => props.job?.failedStep ?? null);
const steps = computed(() =>
  importStepsOf(
    props.source,
    props.job?.step ?? 'queued',
    failedStep.value ? failedRowOf(failedStep.value) : lastRunningStep.value,
  ),
);
const isFinished = computed(() => props.phase === 'done' || props.phase === 'failed');
const download = computed(() => downloadProgressOf(props.job));
const downloadText = computed(() => {
  if (!download.value) return '';
  const done = formatFileSize(download.value.done);
  return download.value.total === null ? done : `${done} / ${formatFileSize(download.value.total)}`;
});
const failedText = computed(() => props.job?.error || '');

const MARK_CLASS: Record<StepStatus, string> = {
  done: 'bg-verdict-ac-bg text-verdict-ac',
  current: 'border-2 border-accent text-accent-text',
  pending: 'bg-surface-strong text-muted',
  failed: 'bg-verdict-wa-bg text-verdict-wa',
};
const labelKey = (key: string, status: StepStatus) =>
  key === 'end' && status === 'failed'
    ? 'admin.polygon.progress.steps.failed'
    : `admin.polygon.progress.steps.${key}`;
</script>

<template>
  <section
    class="glass flex flex-col gap-5 rounded-panel p-5"
    aria-labelledby="import-progress-title"
  >
    <div class="flex items-center justify-between gap-3">
      <h2 id="import-progress-title" class="text-base font-bold">
        {{ $t('admin.polygon.progress.title', { code }) }}
      </h2>
      <AdminBit v-if="!isFinished" placement="queued" />
    </div>
    <p v-if="job" class="text-sm text-muted">
      {{ $t('admin.polygon.progress.state') }}: <span class="font-mono">{{ job.state }}</span>
      <template v-if="!isFinished"> · {{ $t('admin.polygon.progress.runningHint') }}</template>
    </p>

    <ol class="flex flex-col gap-1">
      <li
        v-for="(step, index) in steps"
        :key="step.key"
        :data-step="step.key"
        :data-status="step.status"
        :aria-current="step.status === 'current' ? 'step' : undefined"
        class="flex min-h-11 items-start gap-3"
      >
        <span
          aria-hidden="true"
          class="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold"
          :class="MARK_CLASS[step.status]"
        >
          <Check v-if="step.status === 'done'" class="size-4" />
          <X v-else-if="step.status === 'failed'" class="size-4" />
          <span v-else>{{ index + 1 }}</span>
        </span>
        <span class="flex min-w-0 flex-1 flex-col gap-1 pt-1">
          <span
            :class="
              step.status === 'current' || step.status === 'failed' ? 'font-semibold' : 'text-muted'
            "
          >
            {{ $t(labelKey(step.key, step.status)) }}
            <span class="sr-only">({{ $t(`admin.polygon.progress.status.${step.status}`) }})</span>
          </span>
          <template v-if="step.key === 'downloading' && step.status === 'current' && download">
            <span class="text-sm text-muted">{{ downloadText }}</span>
            <span
              v-if="download.share !== null"
              role="progressbar"
              :aria-label="$t('admin.polygon.progress.steps.downloading')"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-valuenow="Math.round(download.share * 100)"
              class="h-1.5 w-full max-w-80 overflow-hidden rounded-pill bg-surface-strong"
            >
              <span
                class="block h-full rounded-pill bg-gradient-accent"
                :style="{ width: `${download.share * 100}%` }"
              />
            </span>
          </template>
        </span>
      </li>
    </ol>

    <div v-if="phase === 'done' && job?.result" class="flex items-start gap-3">
      <AdminStatus kind="done" :text="$t('admin.polygon.progress.doneText')" />
      <AdminBit placement="done" />
    </div>
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
        :class="ADMIN_PRIMARY_CLASS"
        >{{ $t('admin.polygon.progress.open', { code: job.result.code }) }}</RouterLink
      >
      <slot name="actions" :phase="phase" />
    </div>
  </section>
</template>
