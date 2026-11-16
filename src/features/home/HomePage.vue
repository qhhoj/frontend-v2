<script setup lang="ts">
import PageLayout from '@/components/ui/PageLayout.vue';
import { ADMIN_SCREENS } from '@/features/admin/admin-screens';
import { useCurrentContest } from '@/features/contests/bar/use-current-contest';
import { useSessionStore } from '@/stores/session.store';
import { usePermissions } from '@/stores/use-permissions';
import AnonymousHeader from './AnonymousHeader.vue';
import ContestsCard from './ContestsCard.vue';
import ContinueCard from './ContinueCard.vue';
import HomeHeader from './HomeHeader.vue';
import LiveContestCard from './LiveContestCard.vue';
import MyProblemsCard from './MyProblemsCard.vue';
import NewPostsCard from './NewPostsCard.vue';
import RecentSubmissionsList from './RecentSubmissionsList.vue';

/**
 * The home is a dashboard of two columns: the wide one holds what the viewer reads (recent submissions, then posts), the narrow one
 * what they act on (staff: "Bài của tôi" and its create link; then the contests, and for a student "Làm tiếp"). A visitor sees posts
 * beside contests. On a phone the columns dissolve into one list in the order mine, submissions, contests / continue, posts.
 */
const session = useSessionStore();
const { canAny } = usePermissions();
const { current } = useCurrentContest();
const canEditProblems = () => canAny(ADMIN_SCREENS.problems.permission);
const COLUMNS = 'flex flex-col gap-(--space-section) lg:grid lg:grid-cols-3 lg:items-start';
const MAIN = 'max-lg:contents lg:col-span-2 lg:flex lg:flex-col lg:gap-(--space-section)';
const SIDE = 'max-lg:contents lg:flex lg:flex-col lg:gap-(--space-section)';
</script>

<template>
  <PageLayout v-if="session.user">
    <template #header><HomeHeader :username="session.user.username" /></template>
    <LiveContestCard />
    <div :class="COLUMNS">
      <div :class="MAIN">
        <RecentSubmissionsList :username="session.user.username" class="max-lg:order-2" />
        <NewPostsCard class="max-lg:order-4" />
      </div>
      <div :class="SIDE">
        <MyProblemsCard
          v-if="canEditProblems()"
          :username="session.user.username"
          class="max-lg:order-1"
        />
        <div class="flex flex-col gap-(--space-section) max-lg:order-3">
          <ContestsCard :exclude-key="current?.contest.key" />
          <ContinueCard v-if="!canEditProblems()" :username="session.user.username" />
        </div>
      </div>
    </div>
  </PageLayout>
  <PageLayout v-else>
    <template #header><AnonymousHeader /></template>
    <div :class="COLUMNS">
      <div :class="MAIN"><NewPostsCard /></div>
      <div :class="SIDE"><ContestsCard /></div>
    </div>
  </PageLayout>
</template>
