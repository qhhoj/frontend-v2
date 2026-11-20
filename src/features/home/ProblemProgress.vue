<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ProblemListItem } from '@/api/types/problems';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { formatNumber } from '@/lib/format';
import { VERDICT_MARK_CLASSES } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';

/**
 * The viewer's progress over the whole catalogue: one mark per problem (solved, tried, not tried) and the three counts
 * (the number over its label, three across at every width, which `StatGrid` does not do on a phone).
 * The marks are a picture, not links: a 12 px mark is no touch target; the problem list is one link away in the card's
 * header. Drawn only when one page holds every problem (`complete`); the caller leaves it out otherwise.
 */
const props = defineProps<{ problems: readonly ProblemListItem[]; loading: boolean }>();
const { t } = useI18n();
const locale = useLocaleStore();

type Status = 'solved' | 'attempted' | 'untried';
const STATUS: Record<Status, { labelKey: string; mark: string }> = {
  solved: { labelKey: 'problems.solved', mark: VERDICT_MARK_CLASSES.ac },
  attempted: { labelKey: 'problems.attemptedLong', mark: VERDICT_MARK_CLASSES.pc },
  untried: { labelKey: 'problems.notTried', mark: 'border border-line-strong' },
};
const marks = computed(() =>
  props.problems.map((problem) => {
    const status = STATUS[problem.viewerStatus ?? 'untried'];
    return {
      code: problem.code,
      title: `${problem.name}: ${t(status.labelKey)}`,
      mark: status.mark,
    };
  }),
);
const countOf = (status: ProblemListItem['viewerStatus']) =>
  props.problems.filter((problem) => problem.viewerStatus === status).length;
const stats = computed(() => {
  const solved = countOf('solved');
  const number = (value: number) => formatNumber(value, locale.locale);
  return [
    { label: t('home.continue.solved'), value: number(solved) },
    { label: t('home.continue.unsolved'), value: number(props.problems.length - solved) },
    { label: t('home.continue.attempted'), value: number(countOf('attempted')) },
  ];
});
const summary = computed(() =>
  t('home.continue.mapSummary', { solved: stats.value[0]?.value, total: props.problems.length }),
);
</script>

<template>
  <div data-testid="problem-progress" class="flex flex-col gap-3">
    <p class="eyebrow">{{ $t('home.continue.map') }}</p>
    <SkeletonBlock v-if="loading" class="h-7" />
    <div v-else role="img" :aria-label="summary" class="flex flex-wrap gap-1">
      <span
        v-for="mark in marks"
        :key="mark.code"
        :title="mark.title"
        class="size-3 rounded-cell"
        :class="mark.mark"
      />
    </div>
    <dl class="m-0 grid grid-cols-3 gap-3">
      <div v-for="stat in stats" :key="stat.label" class="flex flex-col-reverse">
        <dt class="text-small text-muted">{{ stat.label }}</dt>
        <dd class="m-0 font-mono text-readout-word leading-tight font-semibold tabular-nums">
          <SkeletonBlock v-if="loading" text class="w-8" />
          <template v-else>{{ stat.value }}</template>
        </dd>
      </div>
    </dl>
  </div>
</template>
