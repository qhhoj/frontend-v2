<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ProblemDetail } from '@/api/types/problems';
import GlassCard from '@/components/GlassCard.vue';
import StateBit from '@/components/StateBit.vue';
import {
  formatMemoryLimit,
  formatNumber,
  formatProblemPoints,
  formatTimeLimit,
} from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';

/** Limits, solve counts, the viewer's status and the problem types (hideable). Keep `ProblemRailSkeleton.vue` in step. */
const props = defineProps<{ problem: ProblemDetail; isSignedIn: boolean }>();
const locale = useLocaleStore();
const typesShown = ref(true);
const facts = computed(() => [
  {
    key: 'time',
    label: 'problem.limits.time',
    value: formatTimeLimit(props.problem.timeLimit),
    tone: 'text-limit-time',
  },
  {
    key: 'memory',
    label: 'problem.limits.memory',
    value: formatMemoryLimit(props.problem.memoryLimit),
    tone: 'text-limit-memory',
  },
  {
    key: 'points',
    label: 'problem.limits.points',
    value: formatProblemPoints(props.problem.points, props.problem.partial, locale.locale),
    tone: 'text-limit-points',
  },
  {
    key: 'acRate',
    label: 'problem.limits.acRate',
    value: `${formatNumber(props.problem.acRate, locale.locale, 1)}%`,
    tone: '',
  },
  {
    key: 'solvers',
    label: 'problem.rail.facts.solvers',
    value: formatNumber(props.problem.userCount, locale.locale),
    tone: '',
  },
]);
/** Standard I/O reads in words; file I/O shows the exact names, which the contestant must type into `freopen`/`assign`. */
const io = computed(() => {
  const { mode, inputFile, outputFile } = props.problem.io;
  return mode === 'file'
    ? { isFile: true, text: `${inputFile} / ${outputFile}` }
    : { isFile: false, text: '' };
});
const STATUS = {
  solved: { key: 'problems.solved', tone: 'text-verdict-ac' },
  attempted: { key: 'problems.attempted', tone: 'text-verdict-tle' },
  untried: { key: 'problem.rail.facts.untried', tone: 'text-muted' },
} as const;
const status = computed(() => STATUS[props.problem.viewerStatus ?? 'untried']);
</script>

<template>
  <GlassCard class="rounded-panel p-4" data-testid="problem-facts">
    <dl data-testid="limits" class="grid grid-cols-2 gap-x-3 gap-y-3.5">
      <div v-for="fact in facts" :key="fact.key">
        <dt class="text-[13px] text-muted">{{ $t(fact.label) }}</dt>
        <dd class="mt-0.5 text-[17px] font-bold tabular-nums" :class="fact.tone">
          {{ fact.value }}
        </dd>
      </div>
      <div v-if="isSignedIn" data-testid="viewer-status">
        <dt class="text-[13px] text-muted">{{ $t('problem.rail.facts.status') }}</dt>
        <dd
          class="mt-0.5 flex min-h-6 items-center gap-1.5 text-[15px] font-bold"
          :class="status.tone"
        >
          {{ $t(status.key) }}
          <StateBit v-if="problem.viewerStatus === 'solved'" variant="rankUp" size="tiny" />
        </dd>
      </div>
      <div class="col-span-2" data-testid="problem-io">
        <dt class="text-[13px] text-muted">{{ $t('problem.rail.facts.io') }}</dt>
        <dd
          class="mt-0.5 text-[15px] font-bold"
          :class="io.isFile ? 'break-all font-mono text-[14px]' : ''"
        >
          {{ io.isFile ? io.text : $t('problem.rail.facts.stdio') }}
        </dd>
      </div>
    </dl>
    <div v-if="problem.types.length" class="mt-3.5 flex flex-col gap-2 border-t border-line pt-3">
      <button
        type="button"
        :aria-expanded="typesShown"
        aria-controls="problem-types"
        class="min-h-8 self-start text-sm font-semibold text-accent-text hover:underline"
        @click="typesShown = !typesShown"
      >
        {{ $t(typesShown ? 'problem.rail.facts.hideTypes' : 'problem.rail.facts.showTypes') }}
      </button>
      <ul v-show="typesShown" id="problem-types" class="flex flex-wrap gap-1.5">
        <li
          v-for="type in problem.types"
          :key="type.id"
          class="rounded-pill bg-surface-strong px-2.5 py-1 text-[13px] text-muted"
        >
          {{ type.fullName }}
        </li>
      </ul>
    </div>
  </GlassCard>
</template>
