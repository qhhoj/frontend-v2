<script setup lang="ts">
import { useSessionStore } from '@/stores/session.store';
import LiveContestCard from './LiveContestCard.vue';
import RatingHeroCard from './RatingHeroCard.vue';
import RecentSubmissionsCard from './RecentSubmissionsCard.vue';
import TopUsersCard from './TopUsersCard.vue';
import WelcomeCard from './WelcomeCard.vue';

const session = useSessionStore();
</script>

<template>
  <div class="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-8">
    <h1 v-if="session.user" class="sr-only">{{ $t('nav.home') }}</h1>
    <section class="flex flex-wrap items-stretch gap-6">
      <RatingHeroCard
        v-if="session.user"
        :username="session.user.username"
        class="min-w-0 flex-1"
      />
      <WelcomeCard v-else class="min-w-0 flex-1" />
    </section>
    <section class="flex flex-wrap gap-6">
      <RecentSubmissionsCard
        v-if="session.user"
        :username="session.user.username"
        class="min-w-0 flex-[999_1_560px]"
      />
      <div
        class="flex min-w-0 flex-[1_1_360px] flex-col gap-6"
        :class="{ 'sm:max-w-sm': !session.user }"
      >
        <LiveContestCard />
        <TopUsersCard />
      </div>
    </section>
  </div>
</template>
