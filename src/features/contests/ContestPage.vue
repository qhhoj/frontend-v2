<script setup lang="ts">
import { computed, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { ApiError } from '@/api/client';
import AdminEditLink from '@/features/admin/edit-link/AdminEditLink.vue';
import { contestEditTarget } from '@/features/admin/edit-link/admin-edit-targets';
import QueryState from '@/components/QueryState.vue';
import CommentsSection from '@/features/comments/CommentsSection.vue';
import ShortLinkButton from '@/features/short-links/ShortLinkButton.vue';
import { shortLinkPath } from '@/features/short-links/short-link-path';
import { phaseAt } from '@/lib/contest-time';
import { useSessionStore } from '@/stores/session.store';
import { usePageTitle } from '@/router/page-title';
import ContestActions from './ContestActions.vue';
import { useCurrentContest } from './bar/use-current-contest';
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
const session = useSessionStore();
const key = computed(() => String(route.params.key));
const { data: contest, isPending, error, refetch } = useContestQuery(key);
usePageTitle(() => contest.value?.name);
const { current } = useCurrentContest();
/** The viewer's running participation in this contest (live, virtual or spectating), or null. */
const run = computed(() =>
  current.value?.contest.key === key.value ? current.value.participation : null,
);
/**
 * While the contest runs, or the viewer's virtual run of it does, the page keeps to the contest (P-23): no comments,
 * where solutions could be discussed, and the announcements first.
 */
const isUnderway = computed(
  () => contest.value?.phase === 'running' || (run.value?.virtual ?? 0) > 0,
);
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
  <div class="page-column">
    <ContestNotFound v-if="isMissing" />
    <QueryState v-else :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton><ContestDetailSkeleton /></template>
      <template v-if="contest">
        <ContestTabs :contest-key="key" :phase="contest.phase" />
        <ContestHeaderCard :contest="contest" :run="run" @elapsed="onCountdownElapsed">
          <template #actions>
            <ContestActions :contest="contest" :current="current" />
            <div class="flex items-start gap-2">
              <ShortLinkButton
                class="flex-1"
                :path="shortLinkPath({ kind: 'contest', key: contest.key })"
              />
              <AdminEditLink class="mt-1.5" :to="contestEditTarget(session.user, contest)" />
            </div>
          </template>
        </ContestHeaderCard>
        <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_var(--qh-sidebar-width)]">
          <div class="flex min-w-0 flex-col gap-6">
            <ContestProblemsTable :contest="contest" />
            <ContestIntroCard :contest="contest" />
            <CommentsSection
              v-if="!isUnderway"
              type="contest"
              :page-key="contest.key"
              class="mt-2"
            />
          </div>
          <aside :aria-label="$t('contests.detail.aside')" class="flex flex-col gap-6">
            <ContestAnnouncementsRail v-if="isUnderway" :contest="contest" />
            <ContestJoinRulesCard
              :contest="contest"
              :acceptance="acceptanceOf(contest.viewer.liveParticipation)"
            />
            <ContestRulesCard :contest="contest" />
            <ContestAnnouncementsRail v-if="!isUnderway" :contest="contest" />
          </aside>
        </div>
      </template>
    </QueryState>
  </div>
</template>
