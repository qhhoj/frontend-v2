<script setup lang="ts">
import { Award, Check, Clock, Cpu, FileText } from 'lucide-vue-next';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import type { ContestDetail } from '@/api/types/contests';
import type { ProblemDetail } from '@/api/types/problems';
import Chip from '@/components/ui/Chip.vue';
import OwnResultChip from '@/features/contests/OwnResultChip.vue';
import { formatMemoryLimit, formatNumber, formatTimeLimit } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useContestProblem } from './use-contest-problem';
import { viewerStatusOf } from './viewer-status';

/**
 * Where the rail is not beside the statement (phones, tablets), the limits and the viewer's status sit under the
 * title as chips, with one line of links (PDF, editorial) and the solve counts, so nobody scrolls past the statement for them.
 * The chips use the limit colours of the facts card. Inside the viewer's contest, like the facts card, the points are the
 * contest's and the status is the viewer's own cell; the site-wide solve counts are left out.
 */
const props = defineProps<{
  problem: ProblemDetail;
  isSignedIn: boolean;
  hasEditorial: boolean;
  contest?: ContestDetail | null;
}>();
const { contestProblem, ownContext, contestPoints } = useContestProblem(
  () => props.problem,
  () => props.contest,
);
const route = useRoute();
const locale = useLocaleStore();

const status = computed(() => viewerStatusOf(props.problem.viewerStatus));
const points = computed(() => formatNumber(props.problem.points, locale.locale, 2, false));
const io = computed(() => props.problem.io);
const LINK = 'inline-flex min-h-11 items-center gap-1 font-semibold text-accent-text underline';
</script>

<template>
  <div data-testid="problem-limit-strip" class="mt-3 flex flex-col gap-1">
    <ul class="m-0 flex list-none flex-wrap gap-1.5 p-0">
      <li>
        <Chip size="md" tone="tag-5" :icon="Clock" :title="$t('problem.limits.time')">
          <span class="font-mono tabular-nums">{{ formatTimeLimit(problem.timeLimit) }}</span>
        </Chip>
      </li>
      <li>
        <Chip size="md" tone="tag-6" :icon="Cpu" :title="$t('problem.limits.memory')">
          <span class="font-mono tabular-nums">{{ formatMemoryLimit(problem.memoryLimit) }}</span>
        </Chip>
      </li>
      <li>
        <Chip size="md" tone="tag-8" :icon="Award" :title="$t('problem.limits.points')">
          <span class="font-mono tabular-nums">{{ contestPoints ?? points }}</span>
          <template v-if="contestPoints === null && problem.partial">
            · {{ $t('problem.strip.partial') }}</template
          >
        </Chip>
      </li>
      <li v-if="io.mode === 'file'" data-testid="strip-io">
        <Chip size="md" :title="$t('problem.rail.facts.io')">
          <span class="font-mono">{{ io.inputFile }} / {{ io.outputFile }}</span>
        </Chip>
      </li>
      <li v-if="contestProblem && ownContext" data-testid="strip-own-result">
        <OwnResultChip :problem="contestProblem" :context="ownContext" inline />
      </li>
      <li v-else-if="isSignedIn" data-testid="strip-status">
        <Chip
          size="md"
          :tone="status.chip"
          :icon="problem.viewerStatus === 'solved' ? Check : undefined"
          >{{ $t(status.key) }}</Chip
        >
      </li>
    </ul>
    <p class="flex flex-wrap items-center gap-x-3 text-meta text-muted">
      <a
        v-if="problem.pdfStatementUrl"
        :href="problem.pdfStatementUrl"
        target="_blank"
        rel="noopener"
        :class="LINK"
        ><FileText aria-hidden="true" class="size-4" />PDF</a
      >
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
