<script setup lang="ts">
import { Search } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import CountdownTimer from '@/components/CountdownTimer.vue';
import EmptyState from '@/components/EmptyState.vue';
import Card from '@/components/ui/Card.vue';
import Notice from '@/components/ui/Notice.vue';
import SegmentedControl from '@/components/ui/SegmentedControl.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { rankingSummary } from './ranking-summary';
import { isPenaltyFormat, showsCellTime, showsCumtime } from '@/lib/ranking-cells';
import type { RankingContext } from '@/lib/ranking-cells';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import AdminEditLink from '@/features/admin/edit-link/AdminEditLink.vue';
import { contestEditTarget } from '@/features/admin/edit-link/admin-edit-targets';
import ContestTabs from './ContestTabs.vue';
import { ownSubmissionsOnly } from './own-submissions';
import { podiumRows } from './podium-rows';
import RankingSkeleton from './RankingSkeleton.vue';
import RankingPodium from './RankingPodium.vue';
import RankingTable from './RankingTable.vue';
import { useContestQuery, useCurrentParticipationQuery, useRankingQuery } from './contests.queries';
import VirtualOverlay from './replay/VirtualOverlay.vue';
import { virtualRunOf } from './replay/virtual-run';

const { t } = useI18n();
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
const PODIUM_SKELETON_CELLS = 3;
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
const podium = computed(() => podiumRows(ranking.value?.rows ?? []));
const summary = computed(() =>
  contest.value
    ? rankingSummary(
        contest.value.formatName,
        ranking.value?.problems.length ?? contest.value.problems?.length ?? 0,
        contest.value.userCount,
      )
    : '',
);
const setVirtual = (value: boolean) =>
  void router.replace({ query: { ...route.query, virtual: value ? '1' : undefined } });
const viewModes = computed(() => [
  { value: 'official', label: t('ranking.official') },
  { value: 'virtual', label: t('ranking.withVirtual') },
]);
const viewMode = computed(() => (withVirtual.value ? 'virtual' : 'official'));
</script>

<template>
  <div class="page-column">
    <QueryState :loading="contestPending" :error="contestError" @retry="refetchContest()">
      <template #skeleton>
        <SkeletonBlock data-skeleton-region="nav" pill class="h-[52px] w-72 max-w-full" />
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div data-skeleton-region="title">
            <p class="text-muted"><SkeletonBlock text class="w-56" /></p>
            <div class="mt-1 page-title">
              <SkeletonBlock text class="w-80 max-w-full" />
            </div>
          </div>
          <div data-skeleton-region="controls" class="flex flex-wrap items-center gap-2.5">
            <SkeletonBlock pill class="h-(--qh-control) w-44" />
            <SkeletonBlock pill class="h-(--qh-control) w-48" />
          </div>
        </div>
      </template>
      <template v-if="contest">
        <ContestTabs :contest-key="key" :phase="contest.phase" />
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="text-muted">{{ summary }}</p>
            <h1 class="mt-1 page-title">
              {{ contest.name }}
            </h1>
          </div>
          <div class="flex flex-wrap items-center gap-2.5">
            <AdminEditLink :to="contestEditTarget(session.user, contest, 'contestRanking')" />
            <p
              v-if="running"
              class="glass flex h-(--qh-control) items-center gap-2.5 rounded-pill px-4.5"
            >
              <span aria-hidden="true" class="size-2 rounded-full bg-accent shadow-glow" />
              <span class="sr-only">{{ $t('ranking.timeLeft') }}</span>
              <CountdownTimer
                :until="contest.endTime"
                class="font-semibold"
                @elapsed="refetchContest()"
              />
            </p>
            <SegmentedControl
              :label="$t('ranking.viewMode')"
              :options="viewModes"
              :model-value="viewMode"
              class="whitespace-nowrap"
              @update:model-value="setVirtual($event === 'virtual')"
            />
            <button
              v-if="virtualRun"
              type="button"
              :aria-pressed="isComparing"
              class="glass min-h-(--qh-control) rounded-pill px-4 text-sm"
              :class="
                isComparing
                  ? 'bg-gradient-accent font-bold text-on-accent'
                  : 'text-content hover:bg-surface-hover'
              "
              @click="setComparing(!isComparing)"
            >
              {{ $t('replay.overlay.toggle') }}
            </button>
            <label
              class="glass flex h-(--qh-control) items-center gap-2 rounded-pill px-4 text-muted"
            >
              <span class="sr-only">{{ $t('ranking.searchLabel') }}</span>
              <Search class="size-4 shrink-0" aria-hidden="true" />
              <input
                v-model="search"
                type="search"
                :placeholder="$t('ranking.searchLabel')"
                class="h-full w-36 bg-transparent text-content"
              />
            </label>
          </div>
        </div>
        <Notice v-if="ranking?.frozen" role="status" :title="$t('ranking.frozenTitle')">
          {{
            $t(
              'ranking.frozenBody',
              { minutes: contest.frozenLastMinutes },
              contest.frozenLastMinutes,
            )
          }}
        </Notice>
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
          <Card
            as="div"
            data-skeleton-region="podium"
            class="grid divide-y divide-line overflow-hidden lg:grid-cols-3 lg:divide-x lg:divide-y-0"
          >
            <div
              v-for="place in PODIUM_SKELETON_CELLS"
              :key="place"
              data-skeleton-region="podium-cell"
              class="flex min-h-11.5 items-center gap-3 px-4 py-2 lg:px-5 lg:py-4"
            >
              <SkeletonBlock round class="size-7 shrink-0" />
              <SkeletonBlock round class="size-6 shrink-0" />
              <SkeletonBlock text class="w-1/2" />
              <SkeletonBlock text class="ml-auto w-10" />
            </div>
          </Card>
          <RankingSkeleton :problem-count="problemCount" :has-time-column="skeletonHasTimeColumn" />
        </div>
      </template>
      <Card v-if="!ranking?.rows.length" as="div">
        <EmptyState>{{ $t('ranking.empty') }}</EmptyState>
      </Card>
      <div v-else-if="ranking" :aria-busy="rankingStale" class="flex flex-col gap-5">
        <Notice v-if="rankingRefreshFailed" tone="warning" bit="sweat" role="status">
          {{ $t('ranking.refreshFailed') }}
        </Notice>
        <RankingPodium
          v-if="podium.length"
          :rows="podium"
          :problems="ranking.problems"
          :context="rankingContext"
          :class="{ 'opacity-60': rankingStale }"
        />
        <Card
          id="ranking-board"
          as="div"
          tabindex="-1"
          class="scroll-mt-4 overflow-hidden"
          :class="{ 'opacity-60': rankingStale }"
        >
          <RankingTable
            :ranking="ranking"
            :rows="rows"
            :context="rankingContext"
            :viewer-id="session.user?.id ?? null"
            :contest-key="key"
            :own-submissions-only="contest ? ownSubmissionsOnly(contest, now) : true"
          />
        </Card>
      </div>
    </QueryState>
    <VirtualOverlay
      v-else-if="contest && virtualRun"
      :contest="contest"
      :participation="virtualRun"
    />
  </div>
</template>
