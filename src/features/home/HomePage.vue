<script setup lang="ts">
import PageHeader from '@/components/ui/PageHeader.vue';
import NewProblemsCard from '@/features/community/NewProblemsCard.vue';
import RecentCommentsCard from '@/features/community/RecentCommentsCard.vue';
import TopContributorsCard from '@/features/community/TopContributorsCard.vue';
import { useSessionStore } from '@/stores/session.store';
import AnonymousHero from './AnonymousHero.vue';
import ContinueCard from './ContinueCard.vue';
import LiveContestCard from './LiveContestCard.vue';
import NewPostsCard from './NewPostsCard.vue';
import RatingHeroCard from './RatingHeroCard.vue';
import RecentSubmissionsList from './RecentSubmissionsList.vue';
import RunningContestsCard from './RunningContestsCard.vue';
import TopPerformersCard from './TopPerformersCard.vue';
import UpcomingContestsCard from './UpcomingContestsCard.vue';

/**
 * Signed in, top to bottom: "Tiếp tục" and "Đang thi" (when the viewer is in a contest), then my submissions, new
 * problems, rating, running and upcoming contests, posts. Below `lg` the two columns collapse into one list in that
 * order (`contents` + `order-*`); from `lg` the left column is the work, the right one the context.
 * A visitor gets the sign-up card, then the public cards (contests, posts, leaderboards).
 */
const session = useSessionStore();
</script>

<template>
  <div class="page-column">
    <template v-if="session.user">
      <PageHeader :title="$t('nav.home')" class="sr-only" />
      <div class="grid gap-4 lg:grid-cols-[repeat(auto-fit,minmax(20rem,1fr))]">
        <ContinueCard :username="session.user.username" />
        <LiveContestCard />
      </div>
      <div class="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_var(--qh-sidebar-width)]">
        <div class="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-4">
          <RecentSubmissionsList :username="session.user.username" class="order-1 lg:order-none" />
          <NewProblemsCard :limit="5" variant="home" class="order-2 lg:order-none" />
          <NewPostsCard class="order-6 lg:order-none" />
        </div>
        <div class="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-4">
          <RatingHeroCard :username="session.user.username" class="order-3 lg:order-none" />
          <RunningContestsCard class="order-4 lg:order-none" />
          <UpcomingContestsCard class="order-5 lg:order-none" />
          <TopPerformersCard class="order-7 lg:order-none" />
          <TopContributorsCard :limit="3" class="order-8 lg:order-none" />
          <RecentCommentsCard :limit="4" class="order-9 lg:order-none" />
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
