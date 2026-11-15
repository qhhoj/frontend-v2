<script setup lang="ts">
import { LocateFixed } from 'lucide-vue-next';
import { computed, nextTick, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '@/components/ui/AppButton.vue';
import Card from '@/components/ui/Card.vue';
import Notice from '@/components/ui/Notice.vue';
import SegmentedControl from '@/components/ui/SegmentedControl.vue';
import SearchInput from '@/components/ui/SearchInput.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { isPenaltyFormat, showsCellTime, showsCumtime } from '@/lib/ranking-cells';
import type { RankingContext } from '@/lib/ranking-cells';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import { boardFreezeOf } from './bar/board-freeze';
import ContestHeader from './bar/ContestHeader.vue';
import { ownSubmissionsOnly } from './own-submissions';
import RankingSkeleton from './RankingSkeleton.vue';
import RankingFreezeNotice from './RankingFreezeNotice.vue';
import RankingTable from './RankingTable.vue';
import { useContestQuery, useCurrentParticipationQuery, useRankingQuery } from './contests.queries';
import VirtualOverlay from './replay/VirtualOverlay.vue';
import { virtualRunOf } from './replay/virtual-run';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const session = useSessionStore();
const key = computed(() => String(route.params.key));
const {
  data: contest,
  isPending: contestPending,
  error: contestError,
  refetch: refetchContest,
} = useContestQuery(key);
const now = useNow();
const isSignedIn = computed(() => session.user !== null);
/** Only an ended contest can have a virtual run to compare with, so a running contest never asks. */
const needsCurrent = computed(
  () =>
    isSignedIn.value && (contest.value?.phase === 'ended' || contest.value?.phase === 'running'),
);
const { data: current } = useCurrentParticipationQuery(needsCurrent);
/** The viewer's running virtual run of this ended contest: the only case the real-board comparison exists. */
const virtualRun = computed(() =>
  contest.value?.phase === 'ended' ? virtualRunOf(current.value, key.value, now.value) : null,
);
/** A live virtual run opens the board with its virtual row; `?virtual=0` keeps the official board. */
const withVirtual = computed(() => {
  const asked = route.query.virtual;
  return asked === '1' || (asked !== '0' && virtualRun.value !== null);
});
const isComparing = computed(() => route.query.compare === '1' && virtualRun.value !== null);
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
} = useRankingQuery(
  key,
  withVirtual,
  // The virtual row moves while the run lasts, so its board is re-read like a running one.
  computed(() => running.value || (withVirtual.value && virtualRun.value !== null)),
);

/** The backend says the full board is closed to this viewer: it answers 403 or shows only their row. */
const isBoardHidden = computed(
  () => contest.value !== undefined && !contest.value.viewer.canSeeFullScoreboard,
);
/** When the board opens depends on the setting: never (H), after the viewer's own run (P), else after the contest. */
const HIDDEN_BODY_KEYS = {
  H: 'ranking.hiddenBody.always',
  P: 'ranking.hiddenBody.afterParticipation',
} as const;
const hiddenBodyKey = computed(() => {
  const visibility = contest.value?.scoreboardVisibility;
  return visibility === 'H' || visibility === 'P'
    ? HIDDEN_BODY_KEYS[visibility]
    : 'ranking.hiddenBody.afterContest';
});

const search = ref('');
/** Problem names by problem id: the board's columns carry only codes, the contest has the names. */
const problemNames = computed(
  () =>
    new Map((contest.value?.problems ?? []).map((problem) => [problem.problemId, problem.name])),
);
const locale = useLocaleStore();
/** How this contest prints cells and scores; the table prints cells with it. */
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
/** The board's own problem list once it is known (a cached board), else the contest's: the skeleton has the table's column count. */
const problemCount = computed(
  () => ranking.value?.problems.length ?? contest.value?.problems?.length ?? 0,
);
/** The format is known before the board is, so the skeleton can have the penalty column the table will have. */
const skeletonHasTimeColumn = computed(
  () =>
    contest.value !== undefined &&
    isPenaltyFormat(contest.value.formatName) &&
    showsCumtime(contest.value.formatName),
);
/** Why cells show "?": said in "Chú giải" while this board is frozen. */
const freezeNote = computed(() => {
  const freeze =
    contest.value && ranking.value?.frozen ? boardFreezeOf(contest.value, now.value, true) : null;
  if (!freeze || !contest.value) return undefined;
  const minutes = contest.value.frozenLastMinutes;
  return t(freeze.bodyKey, { minutes }, minutes);
});
type ViewMode = 'official' | 'virtual' | 'compare';
const viewModes = computed(() => [
  { value: 'official' as const, label: t('ranking.official') },
  { value: 'virtual' as const, label: t('ranking.withVirtual') },
  ...(virtualRun.value ? [{ value: 'compare' as const, label: t('replay.overlay.toggle') }] : []),
]);
const viewMode = computed<ViewMode>(() => {
  if (isComparing.value) return 'compare';
  return withVirtual.value ? 'virtual' : 'official';
});
/** The official board is written out (`virtual=0`) only while a virtual run would otherwise open the virtual one. */
const setViewMode = (mode: ViewMode) => {
  const official = virtualRun.value ? '0' : undefined;
  void router.replace({
    query: {
      ...route.query,
      virtual: mode === 'official' ? official : '1',
      compare: mode === 'compare' ? '1' : undefined,
    },
  });
};
/** The viewer's row on this board: the running virtual run's while it lasts, else the live one. */
const myRow = computed(() => {
  const viewerId = session.user?.id;
  const own = (ranking.value?.rows ?? []).filter((row) => row.user.id === viewerId);
  const run = virtualRun.value;
  const virtualRow = run && own.find((row) => row.participationId === run.id);
  return virtualRow || own.find((row) => row.virtual === 0) || own[0] || null;
});
const table = ref<{ focusRow(participationId: string): boolean } | null>(null);
/** A search that hides the row is cleared first, so the jump always lands. */
async function goToMyRow() {
  const row = myRow.value;
  if (!row) return;
  if (!rows.value.includes(row)) {
    search.value = '';
    await nextTick();
  }
  table.value?.focusRow(row.participationId);
}
</script>

<template>
  <div class="page-column">
    <QueryState :loading="contestPending" :error="contestError" @retry="refetchContest()">
      <template #skeleton>
        <div data-skeleton-region="title" class="page-title">
          <SkeletonBlock text class="w-80 max-w-full" />
        </div>
        <SkeletonBlock data-skeleton-region="nav" class="h-(--qh-control-sm) w-96 max-w-full" />
      </template>
      <template v-if="contest">
        <ContestHeader
          :contest-key="key"
          :contest="contest"
          :is-board-frozen="ranking?.frozen"
          @elapsed="refetchContest()"
        />
        <RankingFreezeNotice :contest="contest" />
        <Notice
          v-if="isBoardHidden"
          role="status"
          :title="$t('ranking.hiddenTitle')"
          data-testid="ranking-hidden"
        >
          {{ $t(hiddenBodyKey) }}
        </Notice>
        <!-- Picks the board, so it stays outside it: compare mode draws no board and still needs a way back. -->
        <SegmentedControl
          :label="$t('ranking.viewMode')"
          :options="viewModes"
          :model-value="viewMode"
          data-testid="ranking-view-mode"
          class="self-start whitespace-nowrap"
          @update:model-value="setViewMode"
        />
      </template>
    </QueryState>
    <QueryState
      v-if="contest && !isComparing"
      :loading="rankingPending"
      :error="ranking || isBoardHidden ? null : rankingError"
      @retry="refetchRanking()"
    >
      <template #skeleton>
        <div class="flex flex-col gap-5">
          <RankingSkeleton :problem-count="problemCount" :has-time-column="skeletonHasTimeColumn" />
        </div>
      </template>
      <div
        v-if="ranking && (ranking.rows.length || !isBoardHidden)"
        :aria-busy="rankingStale"
        class="flex flex-col gap-5"
      >
        <Notice v-if="rankingRefreshFailed" tone="warning" bit="sweat" role="status">
          {{ $t('ranking.refreshFailed') }}
        </Notice>
        <Card
          id="ranking-board"
          as="div"
          tabindex="-1"
          class="scroll-mt-4 overflow-hidden"
          :class="{ 'opacity-60': rankingStale }"
        >
          <RankingTable
            ref="table"
            :ranking="ranking"
            :rows="rows"
            :context="rankingContext"
            :viewer-id="session.user?.id ?? null"
            :contest-key="key"
            :problem-names="problemNames"
            :own-submissions-only="contest ? ownSubmissionsOnly(contest, now) : true"
            :freeze-note="freezeNote"
            :is-stale="rankingStale"
          >
            <template #tools>
              <SearchInput
                v-model="search"
                :label="$t('ranking.searchLabel')"
                class="w-full sm:w-48"
              />
              <AppButton
                v-if="myRow && !isComparing"
                tone="primary"
                data-testid="my-row"
                @click="goToMyRow"
              >
                <template #icon><LocateFixed class="size-4" aria-hidden="true" /></template>
                {{
                  myRow.rank === null || myRow.isDisqualified
                    ? $t('replay.player.myRow')
                    : $t('ranking.myRow', { rank: myRow.rank })
                }}
              </AppButton>
            </template>
          </RankingTable>
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
