<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import { useRoute } from 'vue-router';
import { useAccountAppearanceSync } from '@/features/appearance/use-account-appearance';
import AppFooter from './AppFooter.vue';
import AppHeader from './AppHeader.vue';
import ImpersonationBanner from './ImpersonationBanner.vue';
import HighPriorityBanner from '@/features/notifications/HighPriorityBanner.vue';
import OfficialModeBanner from '@/features/official-mode/OfficialModeBanner.vue';
import BackgroundBlobs from './BackgroundBlobs.vue';
import LoadingLayer from './LoadingLayer.vue';
import { useAccountCacheSync } from './use-account-cache';
import { useAccountThemeSync } from './use-account-theme';

/** Lazy: the admin nav and icons stay out of the bundle every visitor loads. */
const AdminShell = defineAsyncComponent(() => import('@/features/admin/shell/AdminShell.vue'));

useAccountCacheSync();
useAccountThemeSync();
useAccountAppearanceSync();
const route = useRoute();
</script>

<template>
  <!-- `isolate` keeps the fixed blobs (-z-10) above this ground and below the content. -->
  <!-- `viewport-fit=cover` lets the page reach under the notch and home bar; the root keeps its content out of the insets. -->
  <div
    class="relative isolate min-h-dvh pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] bg-ground font-body text-[15px] text-content"
  >
    <BackgroundBlobs />
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-pill focus:bg-surface-solid focus:px-4 focus:py-2"
    >
      {{ $t('app.skipToContent') }}
    </a>
    <ImpersonationBanner />
    <AdminShell v-if="route.meta.layout === 'admin'">
      <slot />
    </AdminShell>
    <template v-else>
      <template v-if="route.meta.layout !== 'auth'">
        <AppHeader />
        <OfficialModeBanner />
        <HighPriorityBanner />
      </template>
      <main id="main" tabindex="-1" class="relative focus-visible:outline-none">
        <slot />
      </main>
      <AppFooter v-if="route.meta.layout !== 'auth'" />
    </template>
    <LoadingLayer />
  </div>
</template>
