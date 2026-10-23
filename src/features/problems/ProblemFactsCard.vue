<script setup lang="ts">
import { problemTypeLabel } from './problem-type-label';
import { computed, ref } from 'vue';
import type { ContestDetail } from '@/api/types/contests';
import type { ProblemDetail } from '@/api/types/problems';
import Card from '@/components/ui/Card.vue';
import Chip from '@/components/ui/Chip.vue';
import StateBit from '@/components/StateBit.vue';
import OwnResultChip from '@/features/contests/OwnResultChip.vue';
import {
  formatMemoryLimit,
  formatNumber,
  formatProblemPoints,
  formatTimeLimit,
} from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useContestProblem } from './use-contest-problem';
import { viewerStatusOf } from './viewer-status';

/**
 * Limits, solve counts, the viewer's status and the problem types (hideable). Keep `ProblemRailSkeleton.vue` in step.
 * Inside the viewer's contest (`contest` lists the problem) the site-wide numbers make no sense: the card shows the
 * contest's points and the viewer's own cell ("Của bạn") instead (P-15).
 * `narrow` hides what the limit strip under the title already says when the rail is not beside the statement: the facts
 * grid, and the whole card when the problem has no types.
 */
const props = defineProps<{
  problem: ProblemDetail;
  isSignedIn: boolean;
  contest?: ContestDetail | null;
  narrow?: { limits: string; typesDivider: string };
}>();
const locale = useLocaleStore();
const typesShown = ref(true);
const { contestProblem, ownContext, contestPoints } = useContestProblem(
  () => props.problem,
  () => props.contest,
);
const limitFacts = computed(() => [
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
]);
const contestFacts = computed(() => {
  const points = contestPoints.value;
  if (points === null) return null;
  return [
    ...limitFacts.value,
    {
      key: 'contestPoints',
      label: 'problem.rail.facts.contestPoints',
      value: points,
      tone: 'text-limit-points',
    },
  ];
});
const siteFacts = computed(() => [
  ...limitFacts.value,
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
const facts = computed(() => contestFacts.value ?? siteFacts.value);
/** File I/O shows the exact names (the contestant types them into `freopen`/`assign`); standard I/O reads in words. */
const ioFacts = computed(() => {
  const { mode, inputFile, outputFile } = props.problem.io;
  return mode === 'file'
    ? [
        { key: 'input', label: 'problem.rail.facts.input', text: inputFile, span: false },
        { key: 'output', label: 'problem.rail.facts.output', text: outputFile, span: false },
      ]
    : [{ key: 'stdio', label: 'problem.rail.facts.io', text: null, span: true }];
});
const status = computed(() => viewerStatusOf(props.problem.viewerStatus));
</script>

<template>
  <Card :class="['p-4', !problem.types.length && narrow?.limits]" data-testid="problem-facts">
    <dl data-testid="limits" :class="['grid grid-cols-2 gap-x-3 gap-y-3.5', narrow?.limits]">
      <div v-for="fact in facts" :key="fact.key">
        <dt class="text-meta text-muted">{{ $t(fact.label) }}</dt>
        <dd class="mt-0.5 text-title font-bold tabular-nums" :class="fact.tone">
          {{ fact.value }}
        </dd>
      </div>
      <div v-if="contestProblem && ownContext" data-testid="viewer-own-result">
        <dt class="text-meta text-muted">{{ $t('contests.problems.columns.own') }}</dt>
        <dd class="mt-0.5 flex min-h-6 items-center text-title font-bold">
          <OwnResultChip :problem="contestProblem" :context="ownContext" inline />
        </dd>
      </div>
      <div v-else-if="isSignedIn" data-testid="viewer-status">
        <dt class="text-meta text-muted">{{ $t('problem.rail.facts.status') }}</dt>
        <dd class="mt-0.5 flex min-h-6 items-center gap-1.5 text-sm font-bold" :class="status.text">
          {{ $t(status.key) }}
          <StateBit v-if="problem.viewerStatus === 'solved'" variant="rankUp" size="tiny" />
        </dd>
      </div>
      <div
        v-for="item in ioFacts"
        :key="item.key"
        :class="{ 'col-span-2': item.span }"
        :data-testid="`problem-io-${item.key}`"
      >
        <dt class="text-meta text-muted">{{ $t(item.label) }}</dt>
        <dd class="mt-0.5 break-all text-title font-bold">
          {{ item.text ?? $t('problem.rail.facts.stdio') }}
        </dd>
      </div>
    </dl>
    <div
      v-if="problem.types.length"
      :class="['flex flex-col gap-2', narrow?.typesDivider ?? 'mt-3.5 border-t border-line pt-3']"
    >
      <button
        type="button"
        :aria-expanded="typesShown"
        aria-controls="problem-types"
        class="min-h-8 self-start text-sm font-semibold text-accent-text hover:underline touch:min-h-11"
        @click="typesShown = !typesShown"
      >
        {{ $t(typesShown ? 'problem.rail.facts.hideTypes' : 'problem.rail.facts.showTypes') }}
      </button>
      <ul v-show="typesShown" id="problem-types" class="flex flex-wrap gap-1.5">
        <li v-for="type in problem.types" :key="type.id">
          <Chip size="md">{{ problemTypeLabel(type) }}</Chip>
        </li>
      </ul>
    </div>
  </Card>
</template>
