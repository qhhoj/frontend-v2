<script setup lang="ts">
import { LocateFixed } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ApiError } from '@/api/client';
import GlassCard from '@/components/GlassCard.vue';
import InlineBit from '@/components/InlineBit.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { translate } from '@/i18n';
import { rankingSummary } from '../ranking-summary';
import { useSessionStore } from '@/stores/session.store';
import ContestNotFound from '../ContestNotFound.vue';
import ContestTabs from '../ContestTabs.vue';
import { useContestQuery } from '../contests.queries';
import ReplayEventFeed from './ReplayEventFeed.vue';
import ReplayPlayerBar from './ReplayPlayerBar.vue';
import ReplayStatePanel from './ReplayStatePanel.vue';
import ReplayTable from './ReplayTable.vue';
import { boardAt } from './replay-board';
import { firstSolveMarks, recentEvents } from './replay-timeline';
import { useReplayLink } from './use-replay-link';
import { useReplayPlayer } from './use-replay-player';
import { useReplayView } from './use-replay-view';

const BOARD_SKELETON_ROWS = 8;
const route = useRoute();
const session = useSessionStore();
const key = computed(() => String(route.params.key));
const {
  data: contest,
  isPending: contestPending,
  error: contestError,
  refetch: refetchContest,
} = useContestQuery(key);
const { state, panelState, wasBuilding, index, timeline, durationSeconds, context, refetch } =
  useReplayView(key, contest);
const player = useReplayPlayer(durationSeconds, 0);
const { seconds, speed, isPlaying, isFinished } = player;
const { seek } = useReplayLink(player, durationSeconds);
const table = ref<{ focusRow(rowId: string): boolean } | null>(null);
/** A board that goes away (refused refetch) stops its clock too. */
watch(state, (next) => next !== 'ready' && player.pause());

const second = computed(() => Math.floor(seconds.value));
const board = computed(() =>
  index.value ? boardAt(index.value, second.value, context.value) : null,
);
const marks = computed(() =>
  index.value ? firstSolveMarks(index.value, durationSeconds.value, context.value) : [],
);
const feed = computed(() => recentEvents(timeline.value, second.value));
const viewerId = computed(() => session.user?.id ?? null);
const myRowId = computed(
  () =>
    board.value?.rows.find((row) => row.kind === 'real' && row.userId === viewerId.value)?.id ??
    null,
);
const summary = computed(() =>
  contest.value
    ? rankingSummary(
        contest.value.formatName,
        index.value?.problems.length ?? contest.value.problems?.length ?? 0,
        contest.value.userCount,
      )
    : '',
);
/** Phase changes only: the replay became ready after building, or playback reached the end. */
const announcement = computed(() => {
  if (state.value !== 'ready') return '';
  if (isFinished.value) return translate('replay.player.finished');
  return wasBuilding.value ? translate('replay.states.ready') : '';
});
/** A missing contest is the contest page's own crying-Bit state, not a replay error with a pointless retry. */
const isMissing = computed(
  () => contestError.value instanceof ApiError && contestError.value.status === 404,
);
const goToMyRow = () => myRowId.value && table.value?.focusRow(myRowId.value);
</script>

<template>
  <div class="page-column">
    <ContestNotFound v-if="isMissing" />
    <QueryState v-else :loading="contestPending" :error="contestError" @retry="refetchContest()">
      <template #skeleton>
        <SkeletonBlock data-skeleton-region="nav" pill class="h-[52px] w-72 max-w-full" />
        <div data-skeleton-region="title">
          <p class="text-muted"><SkeletonBlock text class="w-56" /></p>
          <div class="mt-1 font-display text-4xl font-bold tracking-tight sm:text-[40px]">
            <SkeletonBlock text class="w-80 max-w-full" />
          </div>
        </div>
      </template>
      <template v-if="contest">
        <ContestTabs :contest-key="key" :phase="contest.phase" />
        <div>
          <p class="text-muted">{{ summary }}</p>
          <h1 class="mt-1 page-title">
            {{ contest.name }}
          </h1>
        </div>
      </template>
    </QueryState>
    <p role="status" data-testid="replay-announcement" class="sr-only">{{ announcement }}</p>
    <template v-if="contest">
      <ReplayStatePanel
        v-if="panelState"
        :state="panelState"
        :contest-key="key"
        @retry="refetch()"
      />
      <QueryState v-else :loading="state === 'loading'" :error="null">
        <template #skeleton>
          <div class="flex flex-col gap-5">
            <section
              data-skeleton-region="player"
              data-replay-part="player"
              class="glass flex flex-col gap-3 rounded-card p-4 sm:p-5"
            >
              <div class="flex flex-wrap items-center gap-3">
                <SkeletonBlock pill class="h-11 w-28" />
                <p class="font-mono"><SkeletonBlock text class="w-40" /></p>
                <span class="hidden flex-1 sm:block" />
                <SkeletonBlock pill class="h-[52px] w-[184px]" />
              </div>
              <div class="relative">
                <span class="mt-2 inline-block h-11 w-full"
                  ><SkeletonBlock class="size-full"
                /></span>
              </div>
              <p class="font-mono text-xs"><SkeletonBlock text class="w-full" /></p>
              <p class="text-xs"><SkeletonBlock text class="w-56" /></p>
            </section>
            <div class="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <div data-replay-part="board" class="glass overflow-hidden rounded-card">
                <div
                  v-for="row in BOARD_SKELETON_ROWS"
                  :key="row"
                  data-skeleton-region="board-row"
                  class="flex items-center gap-4 border-t border-line px-5 py-2.5 font-mono text-sm first:border-t-0"
                >
                  <SkeletonBlock text class="w-8" />
                  <span class="flex min-w-0 flex-1 items-center gap-2">
                    <SkeletonBlock class="size-6 shrink-0" />
                    <SkeletonBlock text class="w-40 max-w-full" />
                  </span>
                  <SkeletonBlock text class="hidden w-48 sm:inline-block" />
                </div>
              </div>
              <div
                data-skeleton-region="feed"
                data-replay-part="feed"
                class="glass flex flex-col gap-3 rounded-card p-5"
              >
                <div class="font-display text-lg"><SkeletonBlock text class="w-28" /></div>
                <SkeletonBlock text class="w-full" />
                <SkeletonBlock text class="w-3/4" />
              </div>
            </div>
          </div>
        </template>
        <div v-if="board && index" class="flex flex-col gap-5">
          <ReplayPlayerBar
            :seconds="seconds"
            :duration-seconds="durationSeconds"
            :is-playing="isPlaying"
            :speed="speed"
            :marks="marks"
            @play="player.play()"
            @pause="player.pause()"
            @seek="seek"
            @speed="player.setSpeed($event)"
          />
          <p v-if="isFinished" class="flex items-center gap-3 text-sm text-muted">
            <InlineBit kind="crown" />
            {{ $t('replay.player.finished') }}
          </p>
          <div class="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <GlassCard as="div" data-replay-part="board" class="overflow-hidden">
              <div v-if="myRowId" class="flex justify-end px-5 pt-4">
                <button
                  type="button"
                  class="inline-flex min-h-11 items-center gap-2 rounded-pill border border-line px-4 text-sm font-semibold hover:bg-surface-hover"
                  @click="goToMyRow"
                >
                  <LocateFixed class="size-4" aria-hidden="true" />
                  {{ $t('replay.player.myRow') }}
                </button>
              </div>
              <ReplayTable
                ref="table"
                :board="board"
                :context="context"
                :viewer-id="viewerId"
                :label="$t('replay.table.caption')"
              />
            </GlassCard>
            <ReplayEventFeed
              data-replay-part="feed"
              :entries="feed"
              :problems="index.problems"
              :context="context"
            />
          </div>
        </div>
      </QueryState>
    </template>
  </div>
</template>
