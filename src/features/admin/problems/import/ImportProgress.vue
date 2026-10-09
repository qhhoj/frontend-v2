<script setup lang="ts">
import { computed } from 'vue';
import type { ImportJob } from '@/api/types/problem-imports';
import AdminBit from '../../shell/AdminBit.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import { failureTextOf } from '../../ui/admin-errors';
import type { ImportPhase } from './import-job';

const props = defineProps<{
  code: string;
  phase: ImportPhase | null;
  job: ImportJob | null;
  pollFailure: unknown;
}>();

/** Step indexes: 0 received, 1 queued, 2 running, 3 done. A failed job has no current step. */
const CURRENT_STEP: Record<ImportPhase, number> = { queued: 1, running: 2, done: 3, failed: -1 };
const currentIndex = computed(() => (props.phase ? CURRENT_STEP[props.phase] : 1));
const isFinished = computed(() => props.phase === 'done' || props.phase === 'failed');
const STEPS = [
  { key: 'received', label: 'admin.polygon.progress.received' },
  { key: 'queued', label: 'admin.polygon.progress.queued' },
  { key: 'running', label: 'admin.polygon.progress.running' },
  { key: 'done', label: 'admin.polygon.progress.done' },
] as const;
const steps = computed(() =>
  STEPS.map((step, index) => ({
    ...step,
    isDone: index < currentIndex.value || (props.phase === 'failed' && index === 0),
    isCurrent: index === currentIndex.value,
  })),
);
const failedText = computed(() => props.job?.error || '');
</script>

<template>
  <section
    class="glass flex flex-col gap-5 rounded-panel p-5"
    aria-labelledby="import-progress-title"
  >
    <div class="flex items-center justify-between gap-3">
      <h2 id="import-progress-title" class="text-lg font-semibold">
        {{ $t('admin.polygon.progress.title', { code }) }}
      </h2>
      <AdminBit v-if="!isFinished" placement="queued" />
    </div>
    <p v-if="job" class="text-sm text-muted">
      {{ $t('admin.polygon.progress.state') }}: <span class="font-mono">{{ job.state }}</span>
    </p>

    <ol class="flex flex-col gap-2">
      <li
        v-for="step in steps"
        :key="step.key"
        :aria-current="step.isCurrent ? 'step' : undefined"
        class="flex min-h-11 items-center gap-2"
        :class="step.isCurrent ? 'font-semibold' : ''"
      >
        <span aria-hidden="true">{{ step.isDone ? '✓' : step.isCurrent ? '›' : '·' }}</span>
        <span>{{ $t(step.label) }}</span>
        <span v-if="step.key === 'running' && step.isCurrent" class="text-sm text-muted">
          ({{ $t('admin.polygon.progress.runningHint') }})
        </span>
      </li>
    </ol>

    <div v-if="phase === 'done' && job?.result" class="flex items-start gap-3">
      <AdminStatus kind="done" :text="$t('admin.polygon.progress.doneText')" />
      <AdminBit placement="done" />
    </div>
    <RouterLink
      v-if="phase === 'done' && job?.result"
      :to="{ name: 'admin-problemGeneral', params: { code: job.result.code } }"
      class="min-h-11 self-start rounded-row underline focus-visible:ring-2 focus-visible:ring-accent"
      >{{ $t('admin.polygon.progress.open', { code: job.result.code }) }}</RouterLink
    >
    <AdminStatus
      v-if="phase === 'failed'"
      kind="refused"
      :text="failedText || $t('admin.polygon.progress.failed')"
    />
    <p v-if="pollFailure" class="text-sm text-negative">
      {{ $t('admin.polygon.progress.pollFailed') }} {{ failureTextOf(pollFailure) }}
    </p>
  </section>
</template>
