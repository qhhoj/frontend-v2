<script setup lang="ts">
import PageLayout from '@/components/ui/PageLayout.vue';
import { useCurrentContest } from '@/features/contests/bar/use-current-contest';
import { useSessionStore } from '@/stores/session.store';
import AnonymousHeader from './AnonymousHeader.vue';
import ContestsCard from './ContestsCard.vue';
import ContinueCard from './ContinueCard.vue';
import HomeHeader from './HomeHeader.vue';
import LeaderboardCard from './LeaderboardCard.vue';
import LiveContestCard from './LiveContestCard.vue';
import NewPostsCard from './NewPostsCard.vue';
import NewProblemsCard from '@/features/community/NewProblemsCard.vue';
import RecentSubmissionsList from './RecentSubmissionsList.vue';

/**
 * One column, sections 40 px apart (layout plan §4.1, §4.2). Signed in: the greeting with the viewer's numbers, "Đang thi" (when the
 * viewer is in a contest), "Làm tiếp", the contests, my submissions beside new problems, then posts at full width. A visitor gets
 * the sign-up header (one primary), then the contests, new problems, posts and, last, the leaderboard.
 */
const session = useSessionStore();
const { current } = useCurrentContest();
</script>

<template>
  <PageLayout v-if="session.user">
    <template #header><HomeHeader :username="session.user.username" /></template>
    <LiveContestCard />
    <ContinueCard :username="session.user.username" />
    <ContestsCard :exclude-key="current?.contest.key" />
    <div class="grid gap-x-8 gap-y-(--space-section) lg:grid-cols-2">
      <RecentSubmissionsList :username="session.user.username" />
      <NewProblemsCard :limit="5" />
    </div>
    <NewPostsCard />
  </PageLayout>
  <PageLayout v-else>
    <template #header><AnonymousHeader /></template>
    <ContestsCard />
    <NewProblemsCard :limit="8" />
    <NewPostsCard />
    <LeaderboardCard />
  </PageLayout>
</template>
