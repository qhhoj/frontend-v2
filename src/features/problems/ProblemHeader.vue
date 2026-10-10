<script setup lang="ts">
import { computed } from 'vue';
import type { ProblemDetail } from '@/api/types/problems';
import GlassCard from '@/components/GlassCard.vue';
import { translate } from '@/i18n';
import {
  formatMemoryLimit,
  formatNumber,
  formatProblemPoints,
  formatTimeLimit,
} from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import ProblemStatusChip from './ProblemStatusChip.vue';

const props = defineProps<{ problem: ProblemDetail }>();
const locale = useLocaleStore();
/** Four chips: time (blue), memory (violet), points (amber), AC rate (neutral). Keep `ProblemHeaderSkeleton.vue` in step. */
const limits = computed(() => [
  {
    label: translate('problem.limits.time'),
    value: formatTimeLimit(props.problem.timeLimit),
    tone: 'bg-limit-time-bg text-limit-time',
  },
  {
    label: translate('problem.limits.memory'),
    value: formatMemoryLimit(props.problem.memoryLimit),
    tone: 'bg-limit-memory-bg text-limit-memory',
  },
  {
    label: translate('problem.limits.points'),
    value: formatProblemPoints(props.problem.points, props.problem.partial, locale.locale),
    tone: 'bg-limit-points-bg text-limit-points',
  },
  {
    label: translate('problem.limits.acRate'),
    value: `${formatNumber(props.problem.acRate, locale.locale, 1)}%`,
    tone: 'bg-surface-strong text-muted',
  },
]);
</script>

<template>
  <GlassCard data-testid="problem-header" class="rounded-panel p-6 sm:p-8">
    <div class="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
      <div class="min-w-48 flex-1">
        <p class="font-mono text-sm text-muted">
          {{ problem.code
          }}<template v-if="problem.group"> · {{ problem.group.fullName }}</template>
        </p>
        <h1 class="mt-1 page-title [overflow-wrap:anywhere] max-sm:min-h-[65px]">
          {{ problem.name }}
        </h1>
        <div class="mt-3 flex min-h-8 flex-wrap items-center gap-2">
          <span
            v-for="type in problem.types"
            :key="type.id"
            class="rounded-pill bg-surface-strong px-3 py-1 text-[13px] text-muted"
          >
            {{ type.fullName }}
          </span>
          <ProblemStatusChip :status="problem.viewerStatus" />
        </div>
      </div>
      <div data-testid="header-actions" class="flex min-h-11 max-w-full shrink-0 items-center">
        <slot name="actions" />
      </div>
    </div>
    <dl data-testid="limits" class="mt-5 flex flex-wrap gap-2">
      <div
        v-for="limit in limits"
        :key="limit.label"
        class="flex h-8 items-center gap-1.5 rounded-pill px-3 text-[13px]"
        :class="limit.tone"
      >
        <dt>{{ limit.label }}</dt>
        <dd class="font-bold tabular-nums">{{ limit.value }}</dd>
      </div>
    </dl>
  </GlassCard>
</template>
