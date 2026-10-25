<script setup lang="ts">
import { computed } from 'vue';
import { Check, X } from 'lucide-vue-next';
import type { ImportJob } from '@/api/types/problem-imports';
import ProgressBar from '@/components/ui/ProgressBar.vue';
import { downloadProgressOf, downloadTextOf } from './import-steps';
import type { ShownStep, StepStatus } from './import-steps';

/** The job's rows, one per step, with the downloaded bytes under the running download. */
const props = defineProps<{ steps: ShownStep[]; job: ImportJob | null }>();
const download = computed(() => downloadProgressOf(props.job));
const downloadText = computed(() => downloadTextOf(props.job));

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
        class="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-caption leading-4 font-bold"
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
          <ProgressBar
            v-if="download.share !== null"
            :value="Math.round(download.share * 100)"
            :label="$t('admin.polygon.progress.steps.downloading')"
            class="w-full max-w-80"
          />
        </template>
      </span>
    </li>
  </ol>
</template>
