<script setup lang="ts">
import { computed } from 'vue';
import type { CurrentParticipation } from '@/api/types/contests';
import CountdownTimer from '@/components/CountdownTimer.vue';
import AppButton from '@/components/ui/AppButton.vue';
import Card from '@/components/ui/Card.vue';
import { participationKind } from '@/features/contests/bar/current-contest';
import { useCurrentContest } from '@/features/contests/bar/use-current-contest';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';

/**
 * "Đang thi": the contest the viewer is taking part in, with the time left and, for a contestant, the own rank and
 * score. It reads the same query as the shell (`GET /contests/current`), so it adds no request. The standing comes
 * with the answer (`standing`); older generated types lack it, so it is read defensively and left out when absent.
 */
type OwnStanding = { rank: number | null; score: number; frozen: boolean };
const standingOf = (current: CurrentParticipation): OwnStanding | null =>
  (current as { standing?: OwnStanding | null }).standing ?? null;

const locale = useLocaleStore();
const { current } = useCurrentContest();
const kind = computed(() =>
  current.value ? participationKind(current.value.participation.virtual) : null,
);
/** Never a stale figure: on a frozen board the rank and the score are left out, as in the rail card. */
const standing = computed(() => {
  const own = current.value && kind.value !== 'spectate' ? standingOf(current.value) : null;
  return own && !own.frozen ? own : null;
});
const statusKey = computed(() => {
  if (kind.value === 'spectate') return 'contestBar.spectate';
  return kind.value === 'virtual' ? 'contestBar.virtual' : 'rail.live';
});
const format = (value: number) => formatNumber(value, locale.locale);
</script>

<template>
  <Card
    v-if="current"
    data-testid="live-contest"
    padding="sm"
    class="flex flex-col gap-2 border-l-4 border-l-positive"
  >
    <p class="flex items-center gap-1.5 text-meta font-semibold text-positive">
      <span aria-hidden="true" class="size-2 shrink-0 rounded-full bg-positive" />
      {{ $t(statusKey, { run: current.participation.virtual }) }}
    </p>
    <h2 class="truncate text-title leading-5.5 font-semibold">{{ current.contest.name }}</h2>
    <div class="flex flex-wrap items-baseline gap-x-5 gap-y-1">
      <p>
        <span class="text-meta text-muted">{{ $t('ranking.timeLeft') }}</span>
        <CountdownTimer
          :key="current.participation.endTime"
          :until="current.participation.endTime"
          class="ml-2 text-subtitle font-semibold"
        />
      </p>
      <p v-if="standing" data-testid="live-standing" class="font-mono text-sm tabular-nums">
        <template v-if="standing.rank !== null"
          >{{ $t('rail.rank', { rank: format(standing.rank) }) }} · </template
        >{{ $t('home.liveScore', { score: format(standing.score) }) }}
      </p>
    </div>
    <div class="flex flex-wrap gap-2">
      <AppButton tone="primary" :to="{ name: 'contest', params: { key: current.contest.key } }">{{
        $t('home.liveEnter')
      }}</AppButton>
      <AppButton :to="{ name: 'contest-ranking', params: { key: current.contest.key } }">{{
        $t('contestBar.rankingShort')
      }}</AppButton>
    </div>
  </Card>
</template>
