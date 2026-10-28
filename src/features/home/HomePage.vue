<script setup lang="ts">
import PageHeader from '@/components/ui/PageHeader.vue';
import NewProblemsCard from '@/features/community/NewProblemsCard.vue';
import RecentCommentsCard from '@/features/community/RecentCommentsCard.vue';
import TopContributorsCard from '@/features/community/TopContributorsCard.vue';
import { useSessionStore } from '@/stores/session.store';
import AnonymousHero from './AnonymousHero.vue';
import NewPostsCard from './NewPostsCard.vue';
import RatingHeroCard from './RatingHeroCard.vue';
import RunningContestsCard from './RunningContestsCard.vue';
import TopPerformersCard from './TopPerformersCard.vue';

/**
 * One layout for visitors and signed-in users: only the top card differs (sign-up pitch, or the personal card);
 * every card below it is the same component in both states.
 */
const session = useSessionStore();
</script>

<template>
  <div class="page-column">
    <PageHeader v-if="session.user" :title="$t('nav.home')" class="sr-only" />
    <RatingHeroCard v-if="session.user" :username="session.user.username" />
    <AnonymousHero v-else />
    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_var(--qh-sidebar-width)]">
      <div class="flex min-w-0 flex-col gap-6">
        <RunningContestsCard />
        <NewPostsCard />
      </div>
      <div class="flex min-w-0 flex-col gap-6">
        <TopPerformersCard />
        <TopContributorsCard :limit="3" />
        <!-- At most 5 rows per side list, so the side column does not outgrow the main one. -->
        <NewProblemsCard :limit="5" variant="home" />
        <RecentCommentsCard :limit="4" />
      </div>
    </div>
  </div>
</template>
