<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useAccountAppearanceSync } from '@/features/appearance/use-account-appearance';
import BitRoamLayer from '@/features/bit-roam/BitRoamLayer.vue';
import ContestBar from '@/features/contests/bar/ContestBar.vue';
import { useCurrentContest } from '@/features/contests/bar/use-current-contest';
import { useAccountBitRoamSync } from '@/features/bit-roam/use-bit-roam-choice';
import AppFooter from './AppFooter.vue';
import AppRail from './AppRail.vue';
import ImpersonationBanner from './ImpersonationBanner.vue';
import HighPriorityBanner from '@/features/notifications/HighPriorityBanner.vue';
import LiveAnnouncementAlert from '@/features/contests/live/LiveAnnouncementAlert.vue';
import OfficialModeBanner from '@/features/official-mode/OfficialModeBanner.vue';
import SiteNoticeBanner from '@/features/site-notice/SiteNoticeBanner.vue';
import VerdictToastWatcher from '@/features/submissions/verdict-toast/VerdictToastWatcher.vue';
import LoadingLayer from './LoadingLayer.vue';
import NotificationAnnouncer from './NotificationAnnouncer.vue';
import CommandPalette from './search/CommandPalette.vue';
import { providePageSection } from './nav-items';
import { navSectionOverride } from './nav-section';
import TabBar from './TabBar.vue';
import TopBar from './TopBar.vue';
import { useAccountCacheSync } from './use-account-cache';
import { useAccountThemeSync } from './use-account-theme';
import { useRailCollapse } from './use-rail-collapse';

/** Lazy: the admin nav and icons stay out of the bundle every visitor loads. */
const AdminShell = defineAsyncComponent(() => import('@/features/admin/shell/AdminShell.vue'));
/** Lazy for the same reason: around a teacher's screen ("Quản lý"), which this shell draws like any site page. */
const SiteScreenGate = defineAsyncComponent(
  () => import('@/features/admin/shell/SiteScreenGate.vue'),
);

providePageSection();
useAccountCacheSync();
useAccountThemeSync();
useAccountAppearanceSync();
useAccountBitRoamSync();
const route = useRoute();
/** While the viewer takes part in a contest, every page of the site frame carries the rail's card, and the contest's own pages its bar. */
const { current: currentContest } = useCurrentContest(
  () => route.meta.layout !== 'admin' && route.meta.layout !== 'auth',
);
const isSearchOpen = ref(false);
const { isCollapsed: isRailCollapsed } = useRailCollapse();
/** On the contest's own pages its bar is the status; on every other page the phone's top bar carries a chip instead (the desktop rail's card shows it always). The organiser's workbench of that contest (an `adminArea` route with the same `key`) is not one of its pages. */
const isOnCurrentContest = computed(
  () =>
    currentContest.value !== null &&
    !route.meta.adminArea &&
    (route.params.key === currentContest.value.contest.key ||
      navSectionOverride.value === '/contests'),
);
/** The home's plate already shows the viewer's contest: there the rail's card and the phone's chip would repeat it. */
const isOnHome = computed(() => route.name === 'home');
const railContest = computed(() => (isOnHome.value ? null : currentContest.value));
const chipContest = computed(() =>
  isOnCurrentContest.value || isOnHome.value ? null : currentContest.value,
);
</script>

<template>
  <!-- The ground is on <html> (with the page background, theme/backgrounds.css); `isolate` keeps the background's fixed layers below the content. -->
  <!-- `viewport-fit=cover` lets the page reach under the notch and home bar; the root keeps its content out of the insets. -->
  <div
    class="app-shell relative isolate flex min-h-dvh flex-col pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] font-body text-content print:bg-white print:text-black"
  >
    <a
      href="#main"
      class="sr-only print:hidden focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-overlay focus:rounded-control focus:bg-surface-solid focus:px-4 focus:py-2"
    >
      {{ $t('app.skipToContent') }}
    </a>
    <ImpersonationBanner class="print:hidden" />
    <AdminShell v-if="route.meta.layout === 'admin'">
      <slot />
    </AdminShell>
    <main
      v-else-if="route.meta.layout === 'auth'"
      id="main"
      tabindex="-1"
      class="relative flex-1 focus-visible:outline-none"
    >
      <slot />
    </main>
    <!-- Workbench: the rail (from md) beside the page column; on a phone the top bar and the tab bar; a desktop has no top bar. The rail and the bars are opaque, so the page background shows behind the page column only. -->
    <div v-else class="flex flex-1" :data-rail="isRailCollapsed ? 'collapsed' : 'open'">
      <AppRail :current="railContest" @search="isSearchOpen = true" />
      <div class="flex min-w-0 flex-1 flex-col">
        <NotificationAnnouncer />
        <TopBar :live-contest="chipContest" @search="isSearchOpen = true" />
        <ContestBar v-if="currentContest && isOnCurrentContest" :current="currentContest" />
        <LiveAnnouncementAlert class="print:hidden" />
        <SiteNoticeBanner class="print:hidden" />
        <OfficialModeBanner class="print:hidden" />
        <HighPriorityBanner class="print:hidden" />
        <main id="main" tabindex="-1" class="relative flex-1 focus-visible:outline-none">
          <SiteScreenGate v-if="route.meta.adminArea"><slot /></SiteScreenGate>
          <slot v-else />
        </main>
        <AppFooter class="print:hidden" />
      </div>
      <TabBar />
      <CommandPalette v-model:visible="isSearchOpen" />
    </div>
    <LoadingLayer />
    <VerdictToastWatcher />
    <BitRoamLayer />
  </div>
</template>
