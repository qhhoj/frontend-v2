<script setup lang="ts">
import { TriangleAlert } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ContestDetail } from '@/api/types/contests';
import type { ProblemDetail } from '@/api/types/problems';
import LanguageLabel from '@/components/language/LanguageLabel.vue';
import Card from '@/components/ui/Card.vue';
import Disclosure from '@/components/ui/Disclosure.vue';
import Lamp from '@/components/ui/Lamp.vue';
import OwnResultChip from '@/features/contests/OwnResultChip.vue';
import { formatMemoryLimit, formatNumber, formatPoints, formatTimeLimit } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import type { ProblemLayout } from './problem-layout';
import { UNCATEGORIZED_TYPE_NAME, problemTypeLabel } from './problem-type-label';
import { useContestProblem } from './use-contest-problem';
import { viewerLampOf } from './viewer-status';

/**
 * The facts a contestant needs while coding, as one definition list in the side panel: time, memory, the file names when
 * the problem reads and writes files (those two rows are amber and a warning line follows, because a wrong file name costs
 * a submission), points with "từng phần", the acceptance rate with the solver count, the viewer's own standing, the group
 * and the judge an external problem runs on. Inside the viewer's contest the points are the contest's and the standing is
 * the viewer's own cell; the site-wide rate is left out. Per-language limits fold under the list. `layout` lays the facts
 * two a line where the panel lies above the statement.
 */
interface LimitFact {
  key: string;
  label: string;
  value: string;
  /** A second part of the value ("từng phần", "80 người"): it wraps as a whole, never inside. */
  extra?: string;
  /** A file name the solution must use: amber. */
  isFile?: boolean;
  /** Takes the whole line where the facts lie two a line (a fact left without a neighbour). */
  isWide?: boolean;
}
const props = defineProps<{
  problem: ProblemDetail;
  isSignedIn: boolean;
  contest?: ContestDetail | null;
  layout: Pick<ProblemLayout, 'facts' | 'factFile'>;
}>();
const { t } = useI18n();
const locale = useLocaleStore();
const { contestProblem, ownContext, contestPoints } = useContestProblem(
  () => props.problem,
  () => props.contest,
);
const inContest = computed(() => contestPoints.value !== null);
const usesFiles = computed(() => props.problem.io.mode === 'file');
const fileFacts = computed<LimitFact[]>(() => {
  const { inputFile, outputFile } = props.problem.io;
  if (!usesFiles.value) return [];
  return [
    { key: 'input', label: t('problem.limits.inputFile'), value: inputFile ?? '', isFile: true },
    { key: 'output', label: t('problem.limits.outputFile'), value: outputFile ?? '', isFile: true },
  ];
});
const pointsFact = computed<LimitFact>(() => {
  if (contestPoints.value !== null)
    return {
      key: 'points',
      label: t('problem.rail.facts.contestPoints'),
      value: contestPoints.value,
      isWide: true,
    };
  const points = formatPoints(props.problem.points, locale.locale);
  return {
    key: 'points',
    label: t('problem.limits.points'),
    value: points,
    extra: props.problem.partial ? t('problem.strip.partial') : undefined,
  };
});
/** The site-wide rate and solver count, one fact: "24% · 80 người". */
const rateFacts = computed<LimitFact[]>(() => {
  if (inContest.value) return [];
  const rate = `${formatNumber(props.problem.acRate, locale.locale, 1)}%`;
  const solvers = formatNumber(props.problem.userCount, locale.locale);
  return [
    {
      key: 'acRate',
      label: t('problem.strip.acRate'),
      value: rate,
      extra: t('problem.limits.solvers', { count: solvers }, props.problem.userCount),
    },
  ];
});
const facts = computed<LimitFact[]>(() => [
  { key: 'time', label: t('problem.limits.time'), value: formatTimeLimit(props.problem.timeLimit) },
  {
    key: 'memory',
    label: t('problem.limits.memory'),
    value: formatMemoryLimit(props.problem.memoryLimit),
  },
  ...fileFacts.value,
  pointsFact.value,
  ...rateFacts.value,
]);
const ownCell = computed(() =>
  contestProblem.value && ownContext.value
    ? { problem: contestProblem.value, context: ownContext.value }
    : null,
);
const status = computed(() => viewerLampOf(props.problem.viewerStatus));
const group = computed(() =>
  props.problem.group && props.problem.group.name.toLowerCase() !== UNCATEGORIZED_TYPE_NAME
    ? problemTypeLabel(props.problem.group)
    : null,
);
/** A per-language limit names its language by key; the allowed list has its display name. */
const languageLimits = computed(() =>
  props.problem.languageLimits.map((limit) => ({
    language: {
      key: limit.language,
      name:
        props.problem.allowedLanguages.find((language) => language.key === limit.language)?.name ??
        limit.language,
    },
    text: `${formatTimeLimit(limit.timeLimit)} · ${formatMemoryLimit(limit.memoryLimit)}`,
  })),
);
const languageLimitsShown = ref(false);
/** One fact: a rule over it (the first one is the rule under the card's title), label left, value right. */
const FACT = 'flex min-w-0 items-baseline justify-between gap-2 border-t border-line py-2';
/** What follows the facts (the file warning, the per-language limits) keeps the same rule, across the card. */
const AFTER_FACTS = '-mx-(--qh-pad-surface) border-t border-line px-(--qh-pad-surface)';
/** A fact with a long value takes the whole line where the facts lie two a line. */
const WIDE_FACT = `${FACT} col-span-full`;
</script>

<template>
  <Card padding="md" :title="$t('problem.limits.title')" data-testid="problem-limits">
    <template #actions>
      <span class="font-mono text-small [overflow-wrap:anywhere] text-muted">{{
        problem.code
      }}</span>
    </template>
    <dl data-testid="page-facts" class="m-0 grid grid-cols-1 text-meta" :class="layout.facts">
      <div
        v-for="fact in facts"
        :key="fact.key"
        :data-testid="`limit-${fact.key}`"
        :class="[
          fact.isWide ? WIDE_FACT : FACT,
          fact.isFile && ['bg-cue-attention-bg', layout.factFile],
        ]"
      >
        <dt class="shrink-0 text-muted">{{ fact.label }}</dt>
        <dd
          class="m-0 flex min-w-0 flex-wrap justify-end gap-x-2 text-right font-mono tabular-nums [overflow-wrap:anywhere]"
          :class="fact.isFile ? 'font-bold text-cue-attention' : 'font-medium'"
        >
          <span>{{ fact.value }}</span>
          <span v-if="fact.extra" class="whitespace-nowrap">· {{ fact.extra }}</span>
        </dd>
      </div>
      <div v-if="ownCell" data-testid="strip-own-result" :class="WIDE_FACT">
        <dt class="shrink-0 text-muted">{{ $t('contests.problems.columns.own') }}</dt>
        <dd class="m-0"><OwnResultChip v-bind="ownCell" inline /></dd>
      </div>
      <div v-else-if="isSignedIn" :class="WIDE_FACT">
        <dt class="shrink-0 text-muted">{{ $t('problem.rail.facts.status') }}</dt>
        <dd class="m-0 inline-flex items-center gap-2 font-medium">
          <Lamp :tone="status.tone" />{{ $t(status.labelKey) }}
        </dd>
      </div>
      <div v-if="group" data-testid="problem-group-chip" :class="WIDE_FACT">
        <dt class="shrink-0 text-muted">{{ $t('problems.group') }}</dt>
        <dd class="m-0 min-w-0 truncate text-right font-medium">{{ group }}</dd>
      </div>
      <div v-if="problem.externalJudge" data-testid="external-judge-badge" :class="WIDE_FACT">
        <dt class="shrink-0 text-muted">{{ $t('problem.limits.judgedOn') }}</dt>
        <dd class="m-0 min-w-0 truncate text-right font-medium">{{ problem.externalJudge.oj }}</dd>
      </div>
    </dl>
    <p
      v-if="usesFiles"
      data-testid="file-io-warning"
      class="flex items-start gap-2 py-2 text-small text-cue-attention"
      :class="AFTER_FACTS"
    >
      <TriangleAlert aria-hidden="true" class="mt-0.5 size-4 shrink-0" />{{
        $t('problem.limits.fileWarning')
      }}
    </p>
    <Disclosure
      v-if="languageLimits.length"
      v-model:open="languageLimitsShown"
      :label="$t('problem.limits.perLanguage')"
      :count="languageLimits.length"
      :class="AFTER_FACTS"
    >
      <ul class="flex flex-col gap-1 text-meta">
        <li
          v-for="limit in languageLimits"
          :key="limit.language.key"
          class="flex items-baseline justify-between gap-3"
        >
          <LanguageLabel :language="limit.language" />
          <span class="shrink-0 font-mono tabular-nums">{{ limit.text }}</span>
        </li>
      </ul>
    </Disclosure>
  </Card>
</template>
