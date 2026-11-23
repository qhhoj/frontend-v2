<script setup lang="ts">
import { Timer } from 'lucide-vue-next';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { CurrentParticipation } from '@/api/types/contests';
import CountdownTimer from '@/components/CountdownTimer.vue';
import StatusDot from '@/components/ui/StatusDot.vue';
import { participationKind } from '@/features/contests/bar/current-contest';
import { useContestQuery } from '@/features/contests/contests.queries';
import { solvedSummary } from '@/features/contests/own-result';
import { formatNumber } from '@/lib/format';
import { useMediaQuery } from '@/lib/use-media-query';
import { useLocaleStore } from '@/stores/locale.store';
import { useRailCollapse } from './use-rail-collapse';

/**
 * The rail's card for the contest the viewer is in: its status, name, the clock, and for a contestant the rank and the
 * solved count. The rank is `standing.rank` of the participation (re-read every 2 minutes); it is left out when there is none
 * or the board is frozen. The solved count comes from the contest's problem list (the contest page's query), re-read
 * after each of the viewer's verdicts. A spectator sees the clock only. `AppRail` leaves it out where the page already shows this contest.
 */
/** The rank and the solved count are drawn on the open rail only; narrower or collapsed, the list is not asked. */
const WIDE_RAIL_QUERY = '(min-width: 68.75rem)';
const props = defineProps<{ current: CurrentParticipation }>();
const { t } = useI18n();
const locale = useLocaleStore();
const contestKey = computed(() => props.current.contest.key);
const kind = computed(() => participationKind(props.current.participation.virtual));
const statusText = computed(() => {
  if (kind.value === 'virtual')
    return t('contestBar.virtual', { run: props.current.participation.virtual });
  return t(kind.value === 'spectate' ? 'contestBar.spectate' : 'rail.live');
});

const isContestant = computed(() => kind.value !== 'spectate');
const isWideRail = useMediaQuery(WIDE_RAIL_QUERY);
const { isCollapsed } = useRailCollapse();
const isAsked = computed(() => isContestant.value && isWideRail.value && !isCollapsed.value);
const contest = useContestQuery(contestKey, isAsked);
/** The rank, from `standing`: null for a spectator, before the start, when the board is hidden and while it is frozen. */
const rank = computed(() =>
  props.current.standing?.frozen ? null : (props.current.standing?.rank ?? null),
);
/** Null while the problems are not shown yet (before the start). */
const solved = computed(() => {
  const problems = contest.data.value?.problems;
  return problems && isContestant.value ? solvedSummary(problems) : null;
});
const standing = computed(() =>
  [
    rank.value !== null && t('rail.rank', { rank: formatNumber(rank.value, locale.locale) }),
    solved.value && `${solved.value.solved}/${solved.value.total}`,
  ]
    .filter(Boolean)
    .join(' · '),
);
</script>

<template>
  <RouterLink
    :to="{ name: 'contest', params: { key: contestKey } }"
    data-testid="rail-live-contest"
    :title="current.contest.name"
    class="flex flex-col gap-1 rounded-card border border-line bg-surface-solid p-3 transition-colors hover:border-line-strong rail-slim:items-center rail-slim:p-2"
  >
    <span class="flex items-center gap-1.5 text-caption leading-4 font-semibold text-cue-live">
      <StatusDot tone="live" />
      <span class="rail-slim:sr-only">{{ statusText }}</span>
    </span>
    <span class="truncate text-sm font-semibold text-content rail-slim:sr-only">{{
      current.contest.name
    }}</span>
    <span class="flex items-baseline gap-2 rail-slim:flex-col rail-slim:items-center">
      <Timer aria-hidden="true" class="size-4 shrink-0 self-center text-muted" />
      <span class="font-semibold text-content rail-slim:sr-only">
        <span class="sr-only">{{ $t('ranking.timeLeft') }}</span>
        <CountdownTimer
          :key="current.participation.endTime"
          :until="current.participation.endTime"
        />
      </span>
      <span
        v-if="standing"
        data-testid="rail-live-standing"
        class="text-meta text-muted rail-slim:sr-only"
        >{{ standing }}</span
      >
    </span>
  </RouterLink>
</template>
