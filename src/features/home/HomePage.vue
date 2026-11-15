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
 * One column, sections 40 px apart (layout plan §4.1, §4.2). Signed in: the header is the greeting with the rating line,
 * then the work in priority order: "Đang thi" (when the viewer is in a contest) and "Tiếp tục", the contests, my
 * submissions, then new problems and posts side by side. A visitor gets the sign-up header, then the contests (one line
 * when none), new problems, posts and, last, the leaderboard.
 */
const session = useSessionStore();
const { current } = useCurrentContest();
</script>

<template>
  <PageLayout v-if="session.user">
    <template #header><HomeHeader :username="session.user.username" /></template>
    <div class="flex flex-col gap-(--space-stack)">
      <LiveContestCard />
      <ContinueCard :username="session.user.username" />
    </div>
    <ContestsCard :exclude-key="current?.contest.key" />
    <RecentSubmissionsList :username="session.user.username" />
    <div class="grid gap-x-8 gap-y-(--space-section) lg:grid-cols-2">
      <NewProblemsCard :limit="5" />
      <NewPostsCard />
    </div>
  </PageLayout>
  <PageLayout v-else>
    <template #header><AnonymousHeader /></template>
    <ContestsCard />
    <NewProblemsCard :limit="8" />
    <NewPostsCard />
    <LeaderboardCard />
  </PageLayout>
</template>
