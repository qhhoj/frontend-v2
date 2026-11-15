<script setup lang="ts">
import PageHeader from '@/components/ui/PageHeader.vue';
import NewProblemsCard from '@/features/community/NewProblemsCard.vue';
import RecentCommentsCard from '@/features/community/RecentCommentsCard.vue';
import TopContributorsCard from '@/features/community/TopContributorsCard.vue';
import { useCurrentContest } from '@/features/contests/bar/use-current-contest';
import { useSessionStore } from '@/stores/session.store';
import AnonymousHero from './AnonymousHero.vue';
import ContestsCard from './ContestsCard.vue';
import ContinueCard from './ContinueCard.vue';
import LiveContestCard from './LiveContestCard.vue';
import NewPostsCard from './NewPostsCard.vue';
import RatingHeroCard from './RatingHeroCard.vue';
import RecentSubmissionsList from './RecentSubmissionsList.vue';
import RunningContestsCard from './RunningContestsCard.vue';
import TopPerformersCard from './TopPerformersCard.vue';
import UpcomingContestsCard from './UpcomingContestsCard.vue';

/**
 * Signed in: the main column is the work, top to bottom "Đang thi" (when the viewer is in a contest) and "Tiếp tục",
 * the contests, my submissions, then new problems and posts side by side. The side column is only the greeting, rating
 * and stats card. Below `lg` the two columns collapse into one list in priority order (`contents` + `order-*`).
 * A visitor gets the sign-up card, then the public cards (contests, posts, leaderboards).
 */
const session = useSessionStore();
const { current } = useCurrentContest();
</script>

<template>
  <div class="page-column">
    <template v-if="session.user">
      <PageHeader :title="$t('nav.home')" class="sr-only" />
      <div class="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_var(--qh-sidebar-width)]">
        <div class="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-4">
          <div
            class="order-1 grid gap-4 lg:order-none lg:grid-cols-[repeat(auto-fit,minmax(18rem,1fr))]"
          >
            <LiveContestCard />
            <ContinueCard :username="session.user.username" />
          </div>
          <ContestsCard :exclude-key="current?.contest.key" class="order-3 lg:order-none" />
          <RecentSubmissionsList :username="session.user.username" class="order-4 lg:order-none" />
          <div class="order-5 grid gap-4 lg:order-none lg:grid-cols-2">
            <NewProblemsCard :limit="5" variant="home" />
            <NewPostsCard />
          </div>
        </div>
        <div class="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-4">
          <RatingHeroCard :username="session.user.username" class="order-2 lg:order-none" />
        </div>
      </div>
    </template>
    <template v-else>
      <AnonymousHero />
      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_var(--qh-sidebar-width)]">
        <div class="flex min-w-0 flex-col gap-6">
          <RunningContestsCard />
          <NewPostsCard />
        </div>
        <div class="flex min-w-0 flex-col gap-6">
          <UpcomingContestsCard />
          <TopPerformersCard />
          <TopContributorsCard :limit="3" />
          <!-- At most 5 rows per side list, so the side column does not outgrow the main one. -->
          <NewProblemsCard :limit="5" variant="home" />
          <RecentCommentsCard :limit="4" />
        </div>
      </div>
    </template>
  </div>
</template>
