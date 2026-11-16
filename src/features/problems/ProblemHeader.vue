<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import PageHeader from '@/components/ui/PageHeader.vue';
import type { PageFact } from '@/components/ui/PageHeader.vue';
import AdminEditLink from '@/features/admin/edit-link/AdminEditLink.vue';
import { problemEditTarget } from '@/features/admin/edit-link/admin-edit-targets';
import type { ProblemSection } from '@/features/admin/edit-link/admin-edit-targets';
import type { ContestDetail } from '@/api/types/contests';
import type { ProblemDetail } from '@/api/types/problems';
import Chip from '@/components/ui/Chip.vue';
import OwnResultChip from '@/features/contests/OwnResultChip.vue';
import { acRateTextClass } from '@/lib/ac-rate';
import { formatMemoryLimit, formatNumber, formatPoints, formatTimeLimit } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import { UNCATEGORIZED_TYPE_NAME, problemTypeLabel } from './problem-type-label';
import { useContestProblem } from './use-contest-problem';
import { viewerStatusOf } from './viewer-status';

/**
 * The top of the problem page, on the page background: the section crumb, the title, one meta line (code, group chip, AC
 * rate in its ramp colour, then the facts: limits, points, file names, solvers, the viewer's status), the edit link and the
 * `actions` slot (the submit button, right-most), then the tabs in the default slot. Inside the viewer's contest the points
 * are the contest's and the status is the viewer's own cell; the site-wide solve counts are left out.
 * Keep `ProblemHeaderSkeleton.vue` in step.
 */
/** `section`: the tab being read; the edit link opens its editor tab. */
const props = defineProps<{
  problem: ProblemDetail;
  section?: ProblemSection;
  isSignedIn: boolean;
  contest?: ContestDetail | null;
}>();
const { t } = useI18n();
const session = useSessionStore();
const locale = useLocaleStore();
const { contestProblem, ownContext, contestPoints } = useContestProblem(
  () => props.problem,
  () => props.contest,
);
const inContest = computed(() => contestPoints.value !== null);
const status = computed(() => viewerStatusOf(props.problem.viewerStatus));
const STATUS_TONE = { solved: 'full', attempted: 'partial' } as const;
const statusTone = computed(() => {
  const viewer = props.problem.viewerStatus;
  return viewer === 'solved' || viewer === 'attempted' ? STATUS_TONE[viewer] : undefined;
});
const pointsText = computed(
  () => contestPoints.value ?? formatPoints(props.problem.points, locale.locale),
);
/** Partial scoring says so right after the points (the site-wide scale only). */
const partialFacts = computed<PageFact[]>(() =>
  !inContest.value && props.problem.partial
    ? [{ value: t('problem.strip.partial'), mono: false }]
    : [],
);
/** File I/O names are facts worth a place: the contestant types them into `freopen`/`assign`. Standard I/O shows nothing. */
const fileFacts = computed<PageFact[]>(() => {
  const { mode, inputFile, outputFile } = props.problem.io;
  return mode === 'file'
    ? [
        { label: t('problem.rail.facts.input'), value: inputFile ?? '' },
        { label: t('problem.rail.facts.output'), value: outputFile ?? '' },
      ]
    : [];
});
const facts = computed<PageFact[]>(() => [
  { label: t('problem.limits.time'), value: formatTimeLimit(props.problem.timeLimit) },
  { label: t('problem.limits.memory'), value: formatMemoryLimit(props.problem.memoryLimit) },
  {
    label: t(inContest.value ? 'problem.rail.facts.contestPoints' : 'problem.limits.points'),
    value: pointsText.value,
  },
  ...partialFacts.value,
  ...fileFacts.value,
  ...(inContest.value
    ? []
    : [
        {
          label: t('problem.strip.solvers'),
          value: formatNumber(props.problem.userCount, locale.locale),
        },
      ]),
  ...(props.isSignedIn && !(contestProblem.value && ownContext.value)
    ? [
        {
          label: t('problem.rail.facts.status'),
          value: t(status.value.key),
          tone: statusTone.value,
          mono: false,
        },
      ]
    : []),
]);
</script>

<template>
  <div data-testid="problem-header" class="contents">
    <PageHeader :title="problem.name" :facts="facts">
      <template #meta>
        <span class="font-mono [overflow-wrap:anywhere]">{{ problem.code }}</span>
        <Chip
          v-if="problem.group && problem.group.name !== UNCATEGORIZED_TYPE_NAME"
          data-testid="problem-group-chip"
          >{{ problemTypeLabel(problem.group) }}</Chip
        >
        <Chip v-if="problem.externalJudge" data-testid="external-judge-badge">{{
          $t('problem.externalJudge', { oj: problem.externalJudge.oj })
        }}</Chip>
        <span v-if="!inContest" data-testid="strip-ac-rate" class="flex items-baseline gap-1">
          {{ $t('problem.strip.acRate') }}
          <span :class="['font-mono', acRateTextClass(problem.acRate)]"
            >{{ formatNumber(problem.acRate, locale.locale, 1) }}%</span
          >
        </span>
        <span
          v-if="contestProblem && ownContext"
          data-testid="strip-own-result"
          class="flex items-baseline gap-1"
        >
          {{ $t('contests.problems.columns.own') }}
          <OwnResultChip :problem="contestProblem" :context="ownContext" inline />
        </span>
      </template>
      <template #actions>
        <div class="flex flex-wrap items-center gap-2">
          <AdminEditLink :to="problemEditTarget(session.user, props.problem, props.section)" />
          <slot name="actions" />
        </div>
      </template>
      <template v-if="$slots.default" #tabs><slot /></template>
    </PageHeader>
  </div>
</template>
