<script setup lang="ts">
import { computed, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { ApiError } from '@/api/client';
import QueryState from '@/components/QueryState.vue';
import { phaseAt } from '@/lib/contest-time';
import { usePageTitle } from '@/router/page-title';
import ContestActions from './ContestActions.vue';
import ContestAnnouncementsRail from './ContestAnnouncementsRail.vue';
import ContestDetailSkeleton from './ContestDetailSkeleton.vue';
import ContestHeaderCard from './ContestHeaderCard.vue';
import ContestIntroCard from './ContestIntroCard.vue';
import ContestJoinRulesCard from './ContestJoinRulesCard.vue';
import ContestNotFound from './ContestNotFound.vue';
import ContestProblemsTable from './ContestProblemsTable.vue';
import ContestRulesCard from './ContestRulesCard.vue';
import ContestTabs from './ContestTabs.vue';
import { acceptanceOf } from './join-rules';
import { useContestQuery } from './contests.queries';

/** The countdown can fire up to a second before the server's clock agrees with it: one later refetch closes that gap. */
const SERVER_CATCH_UP_MS = 1500;

const route = useRoute();
const key = computed(() => String(route.params.key));
const { data: contest, isPending, error, refetch } = useContestQuery(key);
usePageTitle(() => contest.value?.name);
/** A contest that does not exist (or is hidden) is a dead end, not a failure to retry: the crying Bit says so. */
const isMissing = computed(() => error.value instanceof ApiError && error.value.status === 404);

let catchUpTimer: ReturnType<typeof setTimeout> | undefined;
/** The server still reports the phase the clock has left behind. */
const serverLagsClock = () =>
  contest.value !== undefined && phaseAt(contest.value, Date.now()) !== contest.value.phase;

function onCountdownElapsed() {
  void refetch();
  clearTimeout(catchUpTimer);
  catchUpTimer = setTimeout(() => {
    if (serverLagsClock()) void refetch();
  }, SERVER_CATCH_UP_MS);
}
onBeforeUnmount(() => clearTimeout(catchUpTimer));
</script>

<template>
  <!-- A loaded contest shows the phone action bar, fixed to the bottom below md: keep the last row clear of it. -->
  <div
    :class="[
      'mx-auto flex max-w-7xl flex-col gap-5 px-4 pt-5 sm:px-8',
      contest ? 'pb-36 md:pb-5' : 'pb-5',
    ]"
  >
    <ContestNotFound v-if="isMissing" />
    <QueryState v-else :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton><ContestDetailSkeleton /></template>
      <template v-if="contest">
        <ContestHeaderCard :contest="contest" @elapsed="onCountdownElapsed">
          <template #actions><ContestActions :contest="contest" /></template>
        </ContestHeaderCard>
        <ContestTabs :contest-key="key" :phase="contest.phase" />
        <div class="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div class="flex min-w-0 flex-col gap-5">
            <ContestProblemsTable :contest="contest" />
            <ContestIntroCard :contest="contest" />
          </div>
          <aside :aria-label="$t('contests.detail.aside')" class="flex flex-col gap-5">
            <ContestRulesCard :contest="contest" />
            <ContestAnnouncementsRail :contest="contest" />
            <ContestJoinRulesCard
              :contest="contest"
              :acceptance="acceptanceOf(contest.viewer.liveParticipation)"
            />
          </aside>
        </div>
      </template>
    </QueryState>
  </div>
</template>
