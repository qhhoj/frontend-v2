<script setup lang="ts">
import { Snowflake, Timer } from 'lucide-vue-next';
import { computed } from 'vue';
import type { ContestDetail, ContestPhase } from '@/api/types/contests';
import CountdownTimer from '@/components/CountdownTimer.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import Chip from '@/components/ui/Chip.vue';
import { formatLabel } from '@/lib/contest-format';
import { ownEndTime, phaseAt } from '@/lib/contest-time';
import { useI18n } from 'vue-i18n';
import { useNow } from '@/lib/use-now';
import ContestTabs from '../ContestTabs.vue';
import { boardFreezeOf } from './board-freeze';
import { useShownClock } from './header-clock';
import { useCurrentContest } from './use-current-contest';

/**
 * The contest bar on the contest's own pages: the one H1 (the name), the phase and format chips, the clock while time runs, the
 * freeze chip beside the clock, and the contest's tabs. `ContestLayout` renders it once for every tab, so the state sits in one place and
 * the layout does not jump between tabs. The shell's `ContestBar` steps aside while this header shows the clock
 * (`header-clock.ts`), so the clock shows once and never zero times. The clock counts what the viewer's own time is: a virtual run's end, else the end of their live
 * window, else the contest's end; it shows only while that time runs.
 * `isBoardFrozen` is the board's own answer where the page has it (the ranking); elsewhere `viewer.boardFrozenAt` decides.
 */
const props = withDefaults(
  defineProps<{
    contestKey: string;
    contest?: ContestDetail;
    isBoardFrozen?: boolean;
    /** The tab to light on a page that is not a tab's own route. */
    current?: string;
  }>(),
  /** Absent is "the page has no board", not false (Vue casts a missing boolean prop to false). */
  { contest: undefined, isBoardFrozen: undefined, current: undefined },
);
const emit = defineEmits<{ elapsed: [] }>();
const now = useNow();
const { current: participation } = useCurrentContest();
/** The viewer's running participation here (live, virtual or spectating), or null. */
const run = computed(() =>
  participation.value?.contest.key === props.contestKey ? participation.value.participation : null,
);
const phase = computed(() => (props.contest ? phaseAt(props.contest, now.value) : undefined));
const clockUntil = computed(() => {
  const contest = props.contest;
  if (!contest) return null;
  if (run.value && run.value.virtual > 0) return run.value.endTime;
  if (phase.value !== 'running') return null;
  return ownEndTime(contest.endTime, run.value?.virtual === 0 ? run.value : null);
});
useShownClock(
  () => props.contestKey,
  () => clockUntil.value !== null,
);
/** The status is a dot and a word; the rest is plain muted text after it: virtual run, format, rated, who may enter. */
const PHASE_DOT: Record<ContestPhase, string> = {
  running: 'bg-positive',
  upcoming: 'bg-accent',
  ended: 'bg-line-strong',
};
const { t } = useI18n();
const facts = computed(() => {
  const contest = props.contest;
  if (!contest) return [];
  const privacy = contest.isPrivate
    ? t('contests.private')
    : contest.isOrganizationPrivate
      ? t('contests.organizationPrivate')
      : null;
  return [
    run.value && run.value.virtual > 0 ? t('contestBar.virtual', { run: run.value.virtual }) : null,
    formatLabel(contest.formatName),
    contest.isRated ? t('contests.rated') : null,
    privacy,
  ].filter((fact): fact is string => fact !== null);
});
const freeze = computed(() =>
  props.contest ? boardFreezeOf(props.contest, now.value, props.isBoardFrozen) : null,
);
</script>

<template>
  <div class="flex flex-col gap-2" data-testid="contest-page-header">
    <header v-if="contest" class="flex flex-wrap items-center gap-x-3 gap-y-1">
      <img
        v-if="contest.logoOverrideImage"
        :src="contest.logoOverrideImage"
        alt=""
        class="size-8 shrink-0 rounded-cell object-contain"
      />
      <div class="flex min-w-0 flex-1 basis-80 flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <h1 class="min-w-0 page-title [overflow-wrap:anywhere]">{{ contest.name }}</h1>
        <p class="flex flex-wrap items-center gap-x-1.5 text-meta text-muted">
          <span v-if="phase" class="inline-flex items-center gap-1.5 font-semibold text-content">
            <span aria-hidden="true" :class="['size-2 rounded-pill', PHASE_DOT[phase]]" />{{
              $t(`contests.phase.${phase}`)
            }}
          </span>
          <template v-for="fact in facts" :key="fact">
            <span aria-hidden="true">·</span>
            <span>{{ fact }}</span>
          </template>
        </p>
      </div>
      <div
        v-if="clockUntil || freeze"
        data-testid="page-header-actions"
        class="flex shrink-0 items-center gap-3"
      >
        <span
          v-if="freeze"
          data-testid="freeze-chip"
          :title="
            $t(freeze.bodyKey, { minutes: contest.frozenLastMinutes }, contest.frozenLastMinutes)
          "
        >
          <Chip tone="info" :icon="Snowflake">{{ $t(freeze.labelKey) }}</Chip>
          <span class="sr-only">{{
            $t(freeze.bodyKey, { minutes: contest.frozenLastMinutes }, contest.frozenLastMinutes)
          }}</span>
        </span>
        <p
          v-if="clockUntil"
          data-testid="contest-clock"
          class="flex items-center gap-1.5 text-subtitle leading-none font-semibold tabular-nums"
        >
          <Timer class="size-4 text-muted" aria-hidden="true" />
          <span class="sr-only">{{ $t('ranking.timeLeft') }}</span>
          <CountdownTimer :key="clockUntil" :until="clockUntil" @elapsed="emit('elapsed')" />
        </p>
      </div>
    </header>
    <div v-else data-skeleton-region="title" class="page-title">
      <SkeletonBlock text class="w-80 max-w-full" />
    </div>
    <ContestTabs :contest-key="contestKey" :phase="contest?.phase" :current="current" />
  </div>
</template>
