<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { ApiError } from '@/api/client';
import QueryState from '@/components/QueryState.vue';
import CommentsSection from '@/features/comments/CommentsSection.vue';
import { usePageTitle } from '@/router/page-title';
import { useCurrentContest } from './bar/use-current-contest';
import ContestAnnouncementsRail from './ContestAnnouncementsRail.vue';
import ContestDetailSkeleton from './ContestDetailSkeleton.vue';
import ContestIntroCard from './ContestIntroCard.vue';
import ContestJoinRulesCard from './ContestJoinRulesCard.vue';
import ContestNotFound from './ContestNotFound.vue';
import ContestProblemsTable from './ContestProblemsTable.vue';
import ContestRulesCard from './ContestRulesCard.vue';
import { acceptanceOf } from './join-rules';
import { useContestQuery } from './contests.queries';

/**
 * The contest's first tab: the problems with my result on each in the main column, then what is read once (the rules to
 * accept, the format and its rules, the description), each folded. The newest announcements sit in a side panel while
 * the contest is underway (under the problems on a phone, where the problems follow the plate at once). The header, the plate and the tabs are `ContestLayout`'s.
 */
const route = useRoute();
const key = computed(() => String(route.params.key));
const { data: contest, isPending, error, refetch } = useContestQuery(key);
usePageTitle(() => contest.value?.name);
const { current } = useCurrentContest();
/** The viewer's running participation in this contest (live, virtual or spectating), or null. */
const run = computed(() =>
  current.value?.contest.key === key.value ? current.value.participation : null,
);
/**
 * While the contest runs, or the viewer's virtual run of it does, the page keeps to the contest: no comments,
 * where solutions could be discussed, and the announcements beside the problems.
 */
const isUnderway = computed(
  () => contest.value?.phase === 'running' || (run.value?.virtual ?? 0) > 0,
);
/** A contest that does not exist (or is hidden) is a dead end, not a failure to retry: the crying Bit says so. */
const isMissing = computed(() => error.value instanceof ApiError && error.value.status === 404);
</script>

<template>
  <ContestNotFound v-if="isMissing" />
  <QueryState v-else :loading="isPending" :error="error" @retry="refetch()">
    <template #skeleton><ContestDetailSkeleton /></template>
    <div v-if="contest" class="flex min-w-0 flex-col gap-6 xl:flex-row xl:items-start">
      <div class="flex min-w-0 flex-1 flex-col gap-4">
        <ContestProblemsTable :contest="contest" />
        <ContestJoinRulesCard
          :contest="contest"
          :acceptance="acceptanceOf(contest.viewer.liveParticipation)"
        />
        <ContestRulesCard :contest="contest" />
        <ContestIntroCard :contest="contest" />
        <CommentsSection v-if="!isUnderway" type="contest" :page-key="contest.key" class="mt-2" />
      </div>
      <ContestAnnouncementsRail v-if="isUnderway" :contest="contest" class="xl:w-80 xl:shrink-0" />
    </div>
  </QueryState>
</template>
