<script setup lang="ts">
import { useSessionStore } from '@/stores/session.store';
import AnonymousHome from './AnonymousHome.vue';
import HomePostsCard from './HomePostsCard.vue';
import LiveContestCard from './LiveContestCard.vue';
import RatingHeroCard from './RatingHeroCard.vue';
import RecentSubmissionsCard from './RecentSubmissionsCard.vue';
import TopUsersCard from './TopUsersCard.vue';

const session = useSessionStore();
</script>

<template>
  <AnonymousHome v-if="!session.user" />
  <div v-else class="page-column">
    <h1 class="sr-only">{{ $t('nav.home') }}</h1>
    <section class="flex flex-wrap items-stretch gap-6">
      <RatingHeroCard :username="session.user.username" class="min-w-0 flex-1" />
    </section>
    <section class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_var(--qh-sidebar-width)]">
      <RecentSubmissionsCard :username="session.user.username" class="min-w-0" />
      <div class="flex min-w-0 flex-col gap-6">
        <LiveContestCard />
        <HomePostsCard />
        <TopUsersCard />
      </div>
    </section>
  </div>
</template>
