<script setup lang="ts">
import { useRouter } from 'vue-router';
import AppShell from '@/features/shell/AppShell.vue';
import PendingPageSkeleton from '@/features/shell/PendingPageSkeleton.vue';
import StagingBanner from '@/features/shell/StagingBanner.vue';

/** While the first navigation waits for the session, a page of the site frame shows a skeleton; sign-in and admin-shell pages stay empty. */
const router = useRouter();
const isPublicTarget = !router.resolve(router.options.history.location).meta.layout;
</script>

<template>
  <StagingBanner />
  <AppShell>
    <RouterView v-slot="{ Component }">
      <component :is="Component" v-if="Component" />
      <PendingPageSkeleton v-else-if="isPublicTarget" />
    </RouterView>
  </AppShell>
</template>
