<script setup lang="ts">
import { computed } from 'vue';
import type { ContestDetail } from '@/api/types/contests';
import type { ProblemDetail } from '@/api/types/problems';
import OwnResultChip from '@/features/contests/OwnResultChip.vue';
import { acRateTextClass } from '@/lib/ac-rate';
import { formatMemoryLimit, formatNumber, formatPoints, formatTimeLimit } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useContestProblem } from './use-contest-problem';
import { viewerStatusOf } from './viewer-status';

/**
 * The facts strip under the title (Workbench): one row of cells for the limits, the points, input/output and the viewer's
 * status, the AC rate (coloured) and the solver count. `cellsClass` is the layout's: the cells stay in sight
 * while the statement scrolls beside the editor. The root is `contents`, so the cells stick within the statement card.
 * Inside the viewer's contest the points are the contest's and the status is the viewer's own cell; the site-wide solve
 * counts are left out.
 */
const props = defineProps<{
  problem: ProblemDetail;
  isSignedIn: boolean;
  contest?: ContestDetail | null;
  cellsClass?: string;
}>();
const { contestProblem, ownContext, contestPoints } = useContestProblem(
  () => props.problem,
  () => props.contest,
);
const locale = useLocaleStore();

const status = computed(() => viewerStatusOf(props.problem.viewerStatus));
const points = computed(() => formatPoints(props.problem.points, locale.locale));
/** Only file I/O is a fact worth a cell: the exact names (the contestant types them into `freopen`/`assign`). Standard I/O is the default and shows nothing. */
const ioCells = computed(() => {
  const { mode, inputFile, outputFile } = props.problem.io;
  return mode === 'file'
    ? [
        { key: 'input', label: 'problem.rail.facts.input', text: inputFile },
        { key: 'output', label: 'problem.rail.facts.output', text: outputFile },
      ]
    : [];
});
/** Cells grow to fill each row (a wrapped row has no empty gap) and never shrink below their value. */
const CELL = 'grow basis-20 bg-surface px-3 py-1.5';
const LABEL = 'text-meta text-muted';
const VALUE = 'font-mono text-sm font-semibold whitespace-nowrap tabular-nums';
</script>

<template>
  <div data-testid="problem-limit-strip" class="contents">
    <dl
      :class="[
        'z-sticky mt-3 flex flex-wrap gap-px overflow-hidden rounded-row border border-line bg-line',
        cellsClass,
      ]"
    >
      <div :class="CELL">
        <dt :class="LABEL">{{ $t('problem.limits.time') }}</dt>
        <dd :class="VALUE">{{ formatTimeLimit(problem.timeLimit) }}</dd>
      </div>
      <div :class="CELL">
        <dt :class="LABEL">{{ $t('problem.limits.memory') }}</dt>
        <dd :class="VALUE">{{ formatMemoryLimit(problem.memoryLimit) }}</dd>
      </div>
      <div :class="CELL" data-testid="strip-points">
        <dt :class="LABEL">
          {{
            $t(
              contestPoints === null ? 'problem.limits.points' : 'problem.rail.facts.contestPoints',
            )
          }}
        </dt>
        <dd :class="VALUE">
          {{ contestPoints ?? points
          }}<span
            v-if="contestPoints === null && problem.partial"
            class="font-body font-normal text-muted"
          >
            · {{ $t('problem.strip.partial') }}</span
          >
        </dd>
      </div>
      <div
        v-for="cell in ioCells"
        :key="cell.key"
        :class="CELL"
        :data-testid="`problem-io-${cell.key}`"
      >
        <dt :class="LABEL">{{ $t(cell.label) }}</dt>
        <dd
          :class="
            cell.text
              ? `${VALUE} [overflow-wrap:anywhere] whitespace-normal`
              : 'text-sm font-semibold whitespace-nowrap'
          "
        >
          {{ cell.text }}
        </dd>
      </div>
      <template v-if="contestPoints === null">
        <div :class="CELL" data-testid="strip-ac-rate">
          <dt :class="LABEL">{{ $t('problem.strip.acRate') }}</dt>
          <dd :class="[VALUE, acRateTextClass(problem.acRate)]">
            {{ formatNumber(problem.acRate, locale.locale, 1) }}%
          </dd>
        </div>
        <div :class="CELL" data-testid="strip-solvers">
          <dt :class="LABEL">{{ $t('problem.strip.solvers') }}</dt>
          <dd :class="VALUE">{{ formatNumber(problem.userCount, locale.locale) }}</dd>
        </div>
      </template>
      <div v-if="contestProblem && ownContext" :class="CELL" data-testid="strip-own-result">
        <dt :class="LABEL">{{ $t('contests.problems.columns.own') }}</dt>
        <dd class="flex min-h-5 items-center">
          <OwnResultChip :problem="contestProblem" :context="ownContext" inline />
        </dd>
      </div>
      <div v-else-if="isSignedIn" :class="CELL" data-testid="strip-status">
        <dt :class="LABEL">{{ $t('problem.rail.facts.status') }}</dt>
        <dd :class="['text-sm font-semibold', status.text]">{{ $t(status.key) }}</dd>
      </div>
    </dl>
  </div>
</template>
