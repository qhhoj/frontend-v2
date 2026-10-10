<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ContestDetail, ParticipationSummary } from '@/api/types/contests';
import GlassCard from '@/components/GlassCard.vue';
import InlineBit from '@/components/InlineBit.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { formatDuration } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import { useSessionStore } from '@/stores/session.store';
import { useRankingQuery } from '../contests.queries';
import ReplayStatePanel from './ReplayStatePanel.vue';
import ReplayTable from './ReplayTable.vue';
import { boardAt, rankRows, virtualRowOf } from './replay-board';
import type { BoardRow } from './replay-board';
import { elapsedSeconds } from './virtual-run';
import { useReplayView } from './use-replay-view';

/** The viewer's running virtual row merged into the replay at the same elapsed time (spec 3.3, M2B "So sánh hai bảng"). */
const props = defineProps<{ contest: ContestDetail; participation: ParticipationSummary }>();
const PODIUM_RANK = 3;
const session = useSessionStore();
const key = computed(() => props.contest.key);
const { state, panelState, index, durationSeconds, context } = useReplayView(
  key,
  computed(() => props.contest),
);
/** The live board with virtual rows, re-read every 30 s like a running board. */
const { data: ranking } = useRankingQuery(key, ref(true), ref(true));
const now = useNow();
const elapsed = computed(() =>
  elapsedSeconds(props.participation.realStart, now.value, durationSeconds.value),
);
const clock = computed(() => formatDuration(elapsed.value));
const virtualRow = computed(() => {
  const row = ranking.value?.rows.find(
    (candidate) => candidate.participationId === props.participation.id,
  );
  return row ? virtualRowOf(row) : null;
});
const board = computed(() =>
  index.value
    ? boardAt(index.value, elapsed.value, context.value, virtualRow.value ? [virtualRow.value] : [])
    : null,
);
const rowsOf = (isReal: boolean) =>
  (board.value?.rows ?? []).filter((row) => (row.kind === 'real') === isReal);
const panelOf = (rows: BoardRow[]) => ({ problems: board.value?.problems ?? [], rows });
const rank = computed(() => board.value?.rows.find((row) => row.kind === 'virtual')?.rank ?? null);
/** Where the viewer would stand among the real rows alone (ghosts left out). */
const realRank = computed(
  () =>
    rankRows((board.value?.rows ?? []).filter((row) => row.kind !== 'ghost')).find(
      (row) => row.kind === 'virtual',
    )?.rank ?? null,
);
const summaryBit = computed(() =>
  realRank.value !== null && realRank.value <= PODIUM_RANK ? 'rankUp' : 'contest',
);
</script>

<template>
  <section
    data-testid="virtual-overlay"
    :aria-label="$t('replay.overlay.label')"
    class="flex flex-col gap-5"
  >
    <ReplayStatePanel v-if="panelState" :state="panelState" :contest-key="contest.key" is-compact />
    <QueryState v-else :loading="state === 'loading'" :error="null">
      <template #skeleton>
        <p
          data-overlay-part="summary"
          class="glass flex items-center gap-3 rounded-tile px-5 py-3.5"
        >
          <SkeletonBlock class="size-12 shrink-0" />
          <SkeletonBlock text class="w-64 max-w-full" />
        </p>
        <div data-overlay-part="panels" class="grid items-start gap-5 lg:grid-cols-2">
          <SkeletonBlock class="h-64 w-full" />
          <SkeletonBlock class="h-64 w-full" />
        </div>
      </template>
      <template v-if="board">
        <p
          data-overlay-part="summary"
          class="glass flex items-center gap-3 rounded-tile px-5 py-3.5"
        >
          <InlineBit :kind="summaryBit" :data-bit-kind="summaryBit" />
          <span v-if="rank !== null">{{ $t('replay.overlay.summary', { rank, realRank }) }}</span>
          <span v-else>{{ $t('replay.overlay.noRow') }}</span>
        </p>
        <div data-overlay-part="panels" class="grid items-start gap-5 lg:grid-cols-2">
          <GlassCard as="div" class="overflow-hidden">
            <h2 class="px-5 pt-4 font-display text-base font-bold">
              {{ $t('replay.overlay.realBoard', { time: clock }) }}
            </h2>
            <ReplayTable
              :board="panelOf(rowsOf(true))"
              :context="context"
              :viewer-id="session.user?.id ?? null"
              :label="$t('replay.overlay.realBoard', { time: clock })"
            />
          </GlassCard>
          <GlassCard as="div" class="overflow-hidden">
            <h2 class="px-5 pt-4 font-display text-base font-bold">
              {{ $t('replay.overlay.yourBoard', { time: clock }) }}
            </h2>
            <ReplayTable
              :board="panelOf(rowsOf(false))"
              :context="context"
              :viewer-id="session.user?.id ?? null"
              :label="$t('replay.overlay.yourBoard', { time: clock })"
            />
          </GlassCard>
        </div>
      </template>
    </QueryState>
  </section>
</template>
