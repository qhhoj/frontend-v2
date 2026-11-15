<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import type { ContestDetail } from '@/api/types/contests';
import type { ProblemDetail } from '@/api/types/problems';
import PdfLink from './PdfLink.vue';
import OwnResultChip from '@/features/contests/OwnResultChip.vue';
import { formatMemoryLimit, formatNumber, formatTimeLimit } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useContestProblem } from './use-contest-problem';
import { viewerStatusOf } from './viewer-status';

/**
 * The facts strip under the title (Workbench): one row of cells for the limits, the points, input/output and the viewer's
 * status, then one line of links (PDF, editorial) and the solve counts. `cellsClass` is the layout's: the cells stay in sight
 * while the statement scrolls beside the editor. The root is `contents`, so the cells stick within the statement card.
 * Inside the viewer's contest the points are the contest's and the status is the viewer's own cell; the site-wide solve
 * counts are left out.
 */
const props = defineProps<{
  problem: ProblemDetail;
  isSignedIn: boolean;
  hasEditorial: boolean;
  contest?: ContestDetail | null;
  cellsClass?: string;
}>();
const { contestProblem, ownContext, contestPoints } = useContestProblem(
  () => props.problem,
  () => props.contest,
);
const route = useRoute();
const locale = useLocaleStore();

const status = computed(() => viewerStatusOf(props.problem.viewerStatus));
const points = computed(() => formatNumber(props.problem.points, locale.locale, 2, false));
/** File I/O shows the exact names (the contestant types them into `freopen`/`assign`); standard I/O reads in words. */
const ioCells = computed(() => {
  const { mode, inputFile, outputFile } = props.problem.io;
  return mode === 'file'
    ? [
        { key: 'input', label: 'problem.rail.facts.input', text: inputFile },
        { key: 'output', label: 'problem.rail.facts.output', text: outputFile },
      ]
    : [{ key: 'stdio', label: 'problem.rail.facts.io', text: null }];
});
/** Cells grow to fill each row (a wrapped row has no empty gap) and never shrink below their value. */
const CELL = 'grow basis-20 bg-surface px-3 py-1.5';
const LABEL = 'text-meta text-muted';
const VALUE = 'font-mono text-sm font-semibold whitespace-nowrap tabular-nums';
const LINK = 'inline-flex min-h-11 items-center gap-1 font-semibold text-accent-text underline';
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
          {{ cell.text ?? $t('problem.rail.facts.stdio') }}
        </dd>
      </div>
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
    <p class="mt-1 flex flex-wrap items-center gap-x-3 text-meta text-muted">
      <!-- An uploaded PDF is shown inline right under the tabs; only the rendered one needs a button up here. -->
      <PdfLink v-if="!problem.pdfStatementUrl" :problem="problem" />
      <RouterLink
        v-if="hasEditorial"
        :to="{ query: { ...route.query, tab: 'editorial' } }"
        :class="LINK"
        >{{ $t('problem.tabs.editorial') }}</RouterLink
      >
      <span v-if="contestPoints === null" class="font-mono tabular-nums">{{
        $t('problem.strip.solves', {
          rate: formatNumber(problem.acRate, locale.locale, 1),
          count: formatNumber(problem.userCount, locale.locale),
        })
      }}</span>
    </p>
  </div>
</template>
