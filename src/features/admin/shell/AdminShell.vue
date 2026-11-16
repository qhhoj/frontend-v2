<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useSessionStore } from '@/stores/session.store';
import { canUseAdmin } from '../admin-access';
import AdminForbidden from './AdminForbidden.vue';
import '../ui/admin-density.css';
import AdminNav from './AdminNav.vue';
import AdminNavSheet from './AdminNavSheet.vue';
import AdminTopBar from './AdminTopBar.vue';
import { useNavCounts } from './overview/admin-overview.queries';
import { useRecentScreens } from './recent/recent-screens';
import { usePaletteShortcut } from './search/use-palette-shortcut';

/** Loaded on first open: the search and its queries stay out of the shell's first paint. */
const AdminCommandPalette = defineAsyncComponent(() => import('./search/AdminCommandPalette.vue'));

const route = useRoute();
const session = useSessionStore();
/** Checked before the page mounts, so a forbidden screen never asks for its data. */
const isAllowed = computed(() =>
  canUseAdmin(session.user, {
    permission: route.meta.permission ?? null,
    capability: route.meta.capability,
  }),
);

/** On <html>, so dialogs teleported to <body> get the admin control tokens too (admin-density.css). */
onMounted(() => document.documentElement.classList.add('qh-admin'));
onBeforeUnmount(() => document.documentElement.classList.remove('qh-admin'));

const navCounts = useNavCounts();
const isPhoneNavOpen = ref(false);
const isPaletteOpen = ref(false);
const hasOpenedPalette = ref(false);
function openPalette() {
  hasOpenedPalette.value = true;
  isPaletteOpen.value = true;
}
usePaletteShortcut(openPalette);

const { remember } = useRecentScreens();
/** A chosen link closes the phone menu, and each screen the viewer may open joins the dashboard's recent list. */
watch(
  () => route.fullPath,
  () => {
    isPhoneNavOpen.value = false;
    if (isAllowed.value) remember(route);
  },
  { immediate: true },
);
</script>

<template>
  <AdminTopBar :is-nav-open="isPhoneNavOpen" @search="openPalette" @menu="isPhoneNavOpen = true" />
  <div class="lg:grid lg:grid-cols-[var(--qa-sidebar)_minmax(0,1fr)]">
    <!-- The column draws the border at full page height; the nav inside is sticky, one screen tall, with its own scroll. -->
    <div class="hidden border-r border-line lg:block">
      <aside class="sticky top-0 h-dvh overflow-y-auto overscroll-contain px-3 py-4">
        <AdminNav :counts="navCounts" />
      </aside>
    </div>
    <AdminNavSheet v-model:open="isPhoneNavOpen" :counts="navCounts" />
    <main id="main" tabindex="-1" class="relative min-w-0 focus-visible:outline-none">
      <!-- No width cap: tables use the width; a form page caps itself (880 px). -->
      <div class="flex w-full flex-col gap-6 px-(--qa-gutter) py-6">
        <slot v-if="isAllowed" />
        <AdminForbidden v-else />
      </div>
    </main>
  </div>
  <AdminCommandPalette v-if="hasOpenedPalette" v-model:visible="isPaletteOpen" />
</template>
