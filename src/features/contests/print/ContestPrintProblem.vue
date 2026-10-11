<script setup lang="ts">
import { computed } from 'vue';
import type { ContestProblem } from '@/api/types/contests';
import NoStatement from '@/features/problems/NoStatement.vue';
import StatementBody from '@/features/problems/StatementBody.vue';
import { useProblemQuery } from '@/features/problems/problems.queries';
import { hasNoStatement } from '@/features/problems/statement-presence';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { limitsText } from '../contest-limits';

/** One problem of the "all statements" sheet: its label and name, the limits and points, then the statement itself. */
const props = defineProps<{
  problem: ContestProblem;
  pointsPrecision: number;
  showLimits: boolean;
}>();
const locale = useLocaleStore();
const code = computed(() => props.problem.code);
const { data: statement, isError } = useProblemQuery(
  code,
  computed(() => locale.locale),
);
const pointsText = computed(() =>
  formatNumber(props.problem.points, locale.locale, props.pointsPrecision),
);
</script>

<template>
  <section class="print-problem" :aria-labelledby="`print-problem-${problem.code}`">
    <h2 :id="`print-problem-${problem.code}`" class="font-display text-2xl font-bold">
      {{ problem.label }}. {{ problem.name }}
    </h2>
    <p v-if="showLimits" class="print-limits mt-2 flex flex-wrap gap-2 text-sm text-muted">
      <span class="rounded-pill border border-line px-3 py-0.5">{{ limitsText(problem) }}</span>
      <span class="rounded-pill border border-line px-3 py-0.5">{{
        $t('contests.print.points', { points: pointsText })
      }}</span>
    </p>
    <p v-if="isError" class="mt-4 text-muted">{{ $t('contests.print.statementFailed') }}</p>
    <template v-else-if="statement">
      <NoStatement
        v-if="hasNoStatement(statement)"
        :code="statement.code"
        :can-edit="statement.canEdit"
        class="print:hidden"
      />
      <StatementBody v-else :html="statement.descriptionHtml" class="mt-4" />
    </template>
  </section>
</template>
