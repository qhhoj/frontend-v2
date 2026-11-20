<script setup lang="ts">
import { computed } from 'vue';
import PageLayout from '@/components/ui/PageLayout.vue';
import { ADMIN_SCREENS } from '@/features/admin/admin-screens';
import { useSessionStore } from '@/stores/session.store';
import { usePermissions } from '@/stores/use-permissions';
import AnonymousHeader from './AnonymousHeader.vue';
import ContestsCard from './ContestsCard.vue';
import ContinueCard from './ContinueCard.vue';
import HomeContestPlate from './HomeContestPlate.vue';
import HomeHeader from './HomeHeader.vue';
import { useRecentSubmissionsQuery } from './home.queries';
import MyProblemsCard from './MyProblemsCard.vue';
import NewProblemsCard from './NewProblemsCard.vue';
import NewPostsCard from './NewPostsCard.vue';
import RecentSubmissionsList from './RecentSubmissionsList.vue';
import { useHomeContests } from './use-home-contests';

/**
 * The home says what to do now, in this order: the contest (the plate), "Làm tiếp", my recent submissions, the coming
 * contests, the news; staff then get "Bài của tôi". From `lg` the first row is the plate (3 of 5 columns) beside "Làm
 * tiếp", and under it the wide column holds the lists and the narrow one the news. With no contest at all the plate is
 * one line over the page, "Làm tiếp" is the narrow column and the news join the wide one. A phone shows one column in the order above. A visitor
 * gets the header with the sign-up, then in the wide column the plate without buttons, the contests and the newest
 * problems, and the news in the narrow one: with no contest the page still offers the problems.
 */
const session = useSessionStore();
const { canAny } = usePermissions();
const contests = useHomeContests();
const canEditProblems = () => canAny(ADMIN_SCREENS.problems.permission);
const username = computed(() => session.user?.username ?? '');
const { data: submissions } = useRecentSubmissionsQuery(username, () => session.user !== null);
/** While the contests load the plate's skeleton holds its place. */
const hasPlate = computed(
  () => contests.isPending.value || contests.plate.value.kind !== 'none' || !!contests.error.value,
);
const ROW = 'grid gap-6 lg:grid-cols-5';
const COLUMNS =
  'flex flex-col gap-(--space-section) lg:grid lg:grid-cols-5 lg:items-start lg:gap-6';
const MAIN = 'max-lg:contents lg:col-span-3 lg:flex lg:flex-col lg:gap-(--space-section)';
const SIDE = 'max-lg:contents lg:col-span-2 lg:flex lg:flex-col lg:gap-(--space-section)';
</script>

<template>
  <PageLayout v-if="session.user">
    <template #header><HomeHeader :username="session.user.username" /></template>
    <div :class="hasPlate ? ROW : 'contents'">
      <HomeContestPlate
        :plate="contests.plate.value"
        :loading="contests.isPending.value"
        :error="contests.error.value"
        :submissions="submissions"
        class="lg:col-span-3"
        @retry="contests.refetch()"
        @elapsed="contests.refetch()"
      />
      <ContinueCard v-if="hasPlate" :username="session.user.username" class="lg:col-span-2" />
    </div>
    <div :class="COLUMNS">
      <div :class="MAIN">
        <RecentSubmissionsList :username="session.user.username" class="max-lg:order-2" />
        <ContestsCard
          :running="contests.otherRunning.value"
          :upcoming="contests.otherUpcoming.value"
          :loading="contests.isPending.value"
          signed-in
          class="max-lg:order-3"
        />
        <NewPostsCard v-if="!hasPlate" class="max-lg:order-4" />
        <MyProblemsCard
          v-if="canEditProblems()"
          :username="session.user.username"
          class="max-lg:order-5"
        />
      </div>
      <div :class="SIDE">
        <ContinueCard v-if="!hasPlate" :username="session.user.username" class="max-lg:order-1" />
        <NewPostsCard v-if="hasPlate" class="max-lg:order-4" />
      </div>
    </div>
  </PageLayout>
  <PageLayout v-else>
    <template #header><AnonymousHeader /></template>
    <div :class="COLUMNS">
      <div :class="MAIN">
        <HomeContestPlate
          :plate="contests.plate.value"
          :loading="contests.isPending.value"
          :error="contests.error.value"
          read-only
          @retry="contests.refetch()"
          @elapsed="contests.refetch()"
        />
        <ContestsCard
          :running="contests.otherRunning.value"
          :upcoming="contests.otherUpcoming.value"
          :loading="contests.isPending.value"
        />
        <NewProblemsCard />
      </div>
      <div :class="SIDE"><NewPostsCard /></div>
    </div>
  </PageLayout>
</template>
