<script setup lang="ts">
import { Search, Snowflake } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CountdownTimer from '@/components/CountdownTimer.vue';
import EmptyState from '@/components/EmptyState.vue';
import InlineBit from '@/components/InlineBit.vue';
import GlassCard from '@/components/GlassCard.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { translate } from '@/i18n';
import { isPenaltyFormat, showsCellTime, showsCumtime } from '@/lib/ranking-cells';
import type { RankingContext } from '@/lib/ranking-cells';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import ContestTabs from './ContestTabs.vue';
import RankingSkeleton from './RankingSkeleton.vue';
import RankingPodium from './RankingPodium.vue';
import RankingTable from './RankingTable.vue';
import { useContestQuery, useCurrentParticipationQuery, useRankingQuery } from './contests.queries';
import VirtualOverlay from './replay/VirtualOverlay.vue';
import { virtualRunOf } from './replay/virtual-run';

const route = useRoute();
const router = useRouter();
const session = useSessionStore();
const key = computed(() => String(route.params.key));
const withVirtual = computed(() => route.query.virtual === '1');
const {
  data: contest,
  isPending: contestPending,
  error: contestError,
  refetch: refetchContest,
} = useContestQuery(key);
const now = useNow();
const isSignedIn = computed(() => session.user !== null);
/** Only an ended contest can have a virtual run to compare with, so a running contest never asks. */
const needsCurrent = computed(() => isSignedIn.value && contest.value?.phase === 'ended');
const { data: current } = useCurrentParticipationQuery(needsCurrent);
/** The viewer's running virtual run of this ended contest: the only case the real-board comparison exists. */
const virtualRun = computed(() =>
  contest.value?.phase === 'ended' ? virtualRunOf(current.value, key.value, now.value) : null,
);
const isComparing = computed(() => route.query.compare === '1' && virtualRun.value !== null);
const setComparing = (value: boolean) =>
  void router.replace({ query: { ...route.query, compare: value ? '1' : undefined } });
/** Also true once a contest that was still upcoming when loaded has started, so polling begins without a reload. */
const running = computed(
  () =>
    contest.value?.phase === 'running' ||
    (contest.value?.phase === 'upcoming' && now.value >= Date.parse(contest.value.startTime)),
);
const {
  data: ranking,
  isPending: rankingPending,
  error: rankingError,
  isRefetchError: rankingRefreshFailed,
  isPlaceholderData: rankingStale,
  refetch: refetchRanking,
} = useRankingQuery(key, withVirtual, running);

const search = ref('');
const locale = useLocaleStore();
/** How this contest prints cells and scores; the podium and the table share it. */
const rankingContext = computed<RankingContext>(() => ({
  formatName: contest.value?.formatName ?? 'default',
  pointsPrecision: contest.value?.pointsPrecision ?? 0,
  locale: locale.locale,
  showsTime: contest.value
    ? showsCellTime(contest.value.formatName, contest.value.formatConfig)
    : false,
}));
const rows = computed(() => {
  const needle = search.value.trim().toLocaleLowerCase();
  const all = ranking.value?.rows ?? [];
  return needle ? all.filter((row) => row.user.username.toLocaleLowerCase().includes(needle)) : all;
});
/** Ranks 1-3 including ties, capped so a mass tie does not fill the page. */
const PODIUM_LIMIT = 6;
const PODIUM_SKELETON_CARDS = 3;
/** The format is known before the board is, so the skeleton can have the penalty column the table will have. */
/** The board's own problem list once it is known (a cached board), else the contest's: the skeleton has the table's column count. */
const problemCount = computed(
  () => ranking.value?.problems.length ?? contest.value?.problems?.length ?? 0,
);
const skeletonHasTimeColumn = computed(
  () =>
    contest.value !== undefined &&
    isPenaltyFormat(contest.value.formatName) &&
    showsCumtime(contest.value.formatName),
);
const podium = computed(() =>
  (ranking.value?.rows ?? [])
    .filter((row) => row.rank !== null && row.rank <= 3 && !row.isDisqualified)
    .slice(0, PODIUM_LIMIT),
);
const summary = computed(() =>
  contest.value
    ? translate('ranking.summary', {
        format: translate(`formats.${contest.value.formatName}`),
        problems: ranking.value?.problems.length ?? contest.value.problems?.length ?? 0,
        participants: contest.value.userCount,
      })
    : '',
);
const setVirtual = (value: boolean) =>
  void router.replace({ query: { ...route.query, virtual: value ? '1' : undefined } });
const VIEW_MODES = [
  { virtual: false, labelKey: 'ranking.official' },
  { virtual: true, labelKey: 'ranking.withVirtual' },
] as const;
</script>

<template>
  <div class="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-8">
    <QueryState :loading="contestPending" :error="contestError" @retry="refetchContest()">
      <template #skeleton>
        <SkeletonBlock data-skeleton-region="nav" pill class="h-[52px] w-72 max-w-full" />
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div data-skeleton-region="title">
            <p class="text-muted"><SkeletonBlock text class="w-56" /></p>
            <div class="mt-1 font-display text-4xl font-bold tracking-tight sm:text-[40px]">
              <SkeletonBlock text class="w-80 max-w-full" />
            </div>
          </div>
          <div data-skeleton-region="controls" class="flex flex-wrap items-center gap-2.5">
            <SkeletonBlock pill class="h-[52px] w-44" />
            <SkeletonBlock pill class="h-12 w-48" />
          </div>
        </div>
      </template>
      <template v-if="contest">
        <ContestTabs :contest-key="key" :phase="contest.phase" />
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="text-muted">{{ summary }}</p>
            <h1 class="mt-1 font-display text-4xl font-bold tracking-tight sm:text-[40px]">
              {{ contest.name }}
            </h1>
          </div>
          <div class="flex flex-wrap items-center gap-2.5">
            <p v-if="running" class="glass flex h-11 items-center gap-2.5 rounded-pill px-4.5">
              <span aria-hidden="true" class="size-2 rounded-full bg-accent shadow-glow" />
              <span class="sr-only">{{ $t('ranking.timeLeft') }}</span>
              <CountdownTimer
                :until="contest.endTime"
                class="font-semibold"
                @elapsed="refetchContest()"
              />
            </p>
            <div
              role="group"
              :aria-label="$t('ranking.viewMode')"
              class="glass flex rounded-pill p-1"
            >
              <button
                v-for="mode in VIEW_MODES"
                :key="mode.labelKey"
                type="button"
                :aria-pressed="withVirtual === mode.virtual"
                class="min-h-11 rounded-pill px-4 text-sm"
                :class="
                  withVirtual === mode.virtual
                    ? 'bg-gradient-accent font-bold text-on-accent'
                    : 'text-content hover:bg-surface-hover'
                "
                @click="setVirtual(mode.virtual)"
              >
                {{ $t(mode.labelKey) }}
              </button>
            </div>
            <button
              v-if="virtualRun"
              type="button"
              :aria-pressed="isComparing"
              class="glass min-h-11 rounded-pill px-4 text-sm"
              :class="
                isComparing
                  ? 'bg-gradient-accent font-bold text-on-accent'
                  : 'text-content hover:bg-surface-hover'
              "
              @click="setComparing(!isComparing)"
            >
              {{ $t('replay.overlay.toggle') }}
            </button>
            <label class="glass flex h-12 items-center gap-2 rounded-pill px-4 text-muted">
              <span class="sr-only">{{ $t('ranking.searchLabel') }}</span>
              <Search class="size-4 shrink-0" aria-hidden="true" />
              <input
                v-model="search"
                type="search"
                :placeholder="$t('ranking.searchLabel')"
                class="min-h-11 w-36 bg-transparent text-content"
              />
            </label>
          </div>
        </div>
        <p
          v-if="ranking?.frozen"
          role="status"
          class="glass flex items-center gap-3 rounded-tile px-5 py-3.5"
        >
          <span
            aria-hidden="true"
            class="flex size-8 shrink-0 items-center justify-center rounded-full bg-verdict-pending-bg text-verdict-pending"
          >
            <Snowflake class="size-4" />
          </span>
          <span
            ><strong class="text-content">{{ $t('ranking.frozenTitle') }}</strong> —
            {{ $t('ranking.frozenBody', { minutes: contest.frozenLastMinutes }) }}</span
          >
        </p>
      </template>
    </QueryState>
    <QueryState
      v-if="contest && !isComparing"
      :loading="rankingPending"
      :error="ranking ? null : rankingError"
      @retry="refetchRanking()"
    >
      <template #skeleton>
        <div class="flex flex-col gap-5">
          <div data-skeleton-region="podium" class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div
              v-for="place in PODIUM_SKELETON_CARDS"
              :key="place"
              data-skeleton-region="podium-card"
              class="glass flex items-center gap-3.5 rounded-card p-5"
            >
              <SkeletonBlock round class="shrink-0" :class="place === 1 ? 'size-15' : 'size-13'" />
              <SkeletonBlock class="size-6 shrink-0" />
              <div class="min-w-0 flex-1">
                <div class="text-lg"><SkeletonBlock text class="w-2/3" /></div>
                <p class="font-mono text-[13px]"><SkeletonBlock text class="w-1/2" /></p>
              </div>
            </div>
          </div>
          <RankingSkeleton :problem-count="problemCount" :has-time-column="skeletonHasTimeColumn" />
        </div>
      </template>
      <EmptyState v-if="!ranking?.rows.length" class="glass rounded-card">{{
        $t('ranking.empty')
      }}</EmptyState>
      <div v-else-if="ranking" :aria-busy="rankingStale" class="flex flex-col gap-5">
        <p
          v-if="rankingRefreshFailed"
          role="status"
          class="glass flex items-center gap-3 rounded-pill px-4 py-2 text-sm text-muted"
        >
          <InlineBit kind="sweat" />
          {{ $t('ranking.refreshFailed') }}
        </p>
        <RankingPodium
          v-if="podium.length"
          :rows="podium"
          :problems="ranking.problems"
          :context="rankingContext"
          :class="{ 'opacity-60': rankingStale }"
        />
        <GlassCard as="div" class="overflow-hidden" :class="{ 'opacity-60': rankingStale }">
          <RankingTable
            :ranking="ranking"
            :rows="rows"
            :context="rankingContext"
            :viewer-id="session.user?.id ?? null"
          />
        </GlassCard>
      </div>
    </QueryState>
    <VirtualOverlay
      v-else-if="contest && virtualRun"
      :contest="contest"
      :participation="virtualRun"
    />
  </div>
</template>
