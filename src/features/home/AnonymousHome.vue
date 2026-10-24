<script setup lang="ts">
import RecentCommentsCard from '@/features/community/RecentCommentsCard.vue';
import NewProblemsCard from '@/features/community/NewProblemsCard.vue';
import TopContributorsCard from '@/features/community/TopContributorsCard.vue';
import AnonymousHero from './AnonymousHero.vue';
import NewPostsCard from './NewPostsCard.vue';
import RunningContestsCard from './RunningContestsCard.vue';
import TopPerformersCard from './TopPerformersCard.vue';
</script>

<template>
  <div class="page-column">
    <AnonymousHero />
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
