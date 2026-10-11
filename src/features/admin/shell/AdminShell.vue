<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next';
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useSessionStore } from '@/stores/session.store';
import { canUseAdmin } from '../admin-access';
import AdminForbidden from './AdminForbidden.vue';
import AdminNav from './AdminNav.vue';
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
  <AdminTopBar @search="openPalette" />
  <div class="min-[900px]:grid min-[900px]:grid-cols-[248px_minmax(0,1fr)]">
    <aside class="hidden border-r border-line px-3 py-5 min-[900px]:block">
      <AdminNav :counts="navCounts" />
    </aside>
    <details
      :open="isPhoneNavOpen"
      class="group border-b border-line px-4 py-1 min-[900px]:hidden"
      @toggle="isPhoneNavOpen = ($event.target as HTMLDetailsElement).open"
    >
      <summary
        class="flex min-h-11 cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden"
      >
        <span class="text-sm text-muted">{{ $t('admin.shell.navToggle') }}</span>
        <span aria-hidden="true" class="text-muted">·</span>
        <span class="min-w-0 flex-1 truncate font-semibold">
          {{ route.meta.titleKey ? $t(route.meta.titleKey) : '' }}
        </span>
        <ChevronDown
          aria-hidden="true"
          class="size-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
        />
      </summary>
      <AdminNav
        :counts="navCounts"
        data-testid="admin-nav-phone"
        class="max-h-[70dvh] overflow-y-auto pt-1 pb-3"
      />
    </details>
    <main id="main" tabindex="-1" class="relative min-w-0 focus-visible:outline-none">
      <div class="flex flex-col gap-5 px-4 py-6 sm:px-8">
        <slot v-if="isAllowed" />
        <AdminForbidden v-else />
      </div>
    </main>
  </div>
  <AdminCommandPalette v-if="hasOpenedPalette" v-model:visible="isPaletteOpen" />
</template>
