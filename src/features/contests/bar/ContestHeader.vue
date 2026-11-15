<script setup lang="ts">
import { Snowflake, Timer } from 'lucide-vue-next';
import { computed } from 'vue';
import type { ContestDetail } from '@/api/types/contests';
import CountdownTimer from '@/components/CountdownTimer.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import Chip from '@/components/ui/Chip.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import { ownEndTime, phaseAt } from '@/lib/contest-time';
import { useNow } from '@/lib/use-now';
import ContestChips from '../ContestChips.vue';
import ContestTabs from '../ContestTabs.vue';
import PhasePill from '../PhasePill.vue';
import { boardFreezeOf } from './board-freeze';
import { useCurrentContest } from './use-current-contest';

/**
 * The contest bar on the contest's own pages: the one H1 (the name), the phase and format chips, the clock while time runs, the
 * freeze chip beside the clock, and the contest's tabs. Every tab renders it, so the state sits in one place and
 * the layout does not jump between tabs. The shell's `ContestBar` steps aside on these pages (`contest-pages.ts`), so the
 * clock shows once. The clock counts what the viewer's own time is: a virtual run's end, else the end of their live
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
const freeze = computed(() =>
  props.contest ? boardFreezeOf(props.contest, now.value, props.isBoardFrozen) : null,
);
</script>

<template>
  <div class="flex flex-col gap-3" data-testid="contest-page-header">
    <PageHeader v-if="contest" :title="contest.name">
      <template v-if="contest.logoOverrideImage" #start>
        <img
          :src="contest.logoOverrideImage"
          alt=""
          class="size-8 shrink-0 rounded-cell object-contain md:size-10"
        />
      </template>
      <template #meta>
        <PhasePill v-if="phase" :phase="phase" />
        <Chip v-if="run && run.virtual > 0" tone="accent">{{
          $t('contestBar.virtual', { run: run.virtual })
        }}</Chip>
        <ContestChips :contest="contest" />
      </template>
      <template v-if="clockUntil || freeze" #actions>
        <span
          v-if="freeze"
          data-testid="freeze-chip"
          :title="
            $t(freeze.bodyKey, { minutes: contest.frozenLastMinutes }, contest.frozenLastMinutes)
          "
        >
          <Chip size="md" tone="info" :icon="Snowflake">{{ $t(freeze.labelKey) }}</Chip>
          <span class="sr-only">{{
            $t(freeze.bodyKey, { minutes: contest.frozenLastMinutes }, contest.frozenLastMinutes)
          }}</span>
        </span>
        <p
          v-if="clockUntil"
          data-testid="contest-clock"
          class="flex items-center gap-1.5 text-title leading-none font-semibold"
        >
          <Timer class="size-4 text-muted" aria-hidden="true" />
          <span class="sr-only">{{ $t('ranking.timeLeft') }}</span>
          <CountdownTimer :key="clockUntil" :until="clockUntil" @elapsed="emit('elapsed')" />
        </p>
      </template>
    </PageHeader>
    <div v-else data-skeleton-region="title" class="page-title">
      <SkeletonBlock text class="w-80 max-w-full" />
    </div>
    <ContestTabs :contest-key="contestKey" :phase="contest?.phase" :current="current" />
  </div>
</template>
