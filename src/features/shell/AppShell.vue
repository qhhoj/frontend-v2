<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import { useRoute } from 'vue-router';
import { useAccountAppearanceSync } from '@/features/appearance/use-account-appearance';
import BitRoamLayer from '@/features/bit-roam/BitRoamLayer.vue';
import ContestBar from '@/features/contests/bar/ContestBar.vue';
import { useCurrentContest } from '@/features/contests/bar/use-current-contest';
import { useAccountBitRoamSync } from '@/features/bit-roam/use-bit-roam-choice';
import AppFooter from './AppFooter.vue';
import AppHeader from './AppHeader.vue';
import ImpersonationBanner from './ImpersonationBanner.vue';
import HighPriorityBanner from '@/features/notifications/HighPriorityBanner.vue';
import LiveAnnouncementAlert from '@/features/contests/live/LiveAnnouncementAlert.vue';
import OfficialModeBanner from '@/features/official-mode/OfficialModeBanner.vue';
import SiteNoticeBanner from '@/features/site-notice/SiteNoticeBanner.vue';
import BackgroundBlobs from './BackgroundBlobs.vue';
import LoadingLayer from './LoadingLayer.vue';
import { useAccountCacheSync } from './use-account-cache';
import { useAccountThemeSync } from './use-account-theme';

/** Lazy: the admin nav and icons stay out of the bundle every visitor loads. */
const AdminShell = defineAsyncComponent(() => import('@/features/admin/shell/AdminShell.vue'));

useAccountCacheSync();
useAccountThemeSync();
useAccountAppearanceSync();
useAccountBitRoamSync();
const route = useRoute();
/** While the viewer takes part in a contest, every public page carries its bar (P-15 B). */
const { current: currentContest } = useCurrentContest(
  () => route.meta.layout !== 'admin' && route.meta.layout !== 'auth',
);
</script>

<template>
  <!-- `isolate` keeps the fixed blobs (-z-10) above this ground and below the content. -->
  <!-- `viewport-fit=cover` lets the page reach under the notch and home bar; the root keeps its content out of the insets. -->
  <div
    class="relative isolate flex min-h-dvh flex-col pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] bg-ground font-body text-content print:bg-white print:text-black"
  >
    <BackgroundBlobs class="print:hidden" />
    <a
      href="#main"
      class="sr-only print:hidden focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-pill focus:bg-surface-solid focus:px-4 focus:py-2"
    >
      {{ $t('app.skipToContent') }}
    </a>
    <ImpersonationBanner class="print:hidden" />
    <AdminShell v-if="route.meta.layout === 'admin'">
      <slot />
    </AdminShell>
    <template v-else>
      <template v-if="route.meta.layout !== 'auth'">
        <AppHeader class="print:hidden" />
        <ContestBar v-if="currentContest" :current="currentContest" />
        <LiveAnnouncementAlert class="print:hidden" />
        <SiteNoticeBanner class="print:hidden" />
        <OfficialModeBanner class="print:hidden" />
        <HighPriorityBanner class="print:hidden" />
      </template>
      <main id="main" tabindex="-1" class="relative flex-1 focus-visible:outline-none">
        <slot />
      </main>
      <AppFooter v-if="route.meta.layout !== 'auth'" class="print:hidden" />
    </template>
    <LoadingLayer />
    <BitRoamLayer />
  </div>
</template>
