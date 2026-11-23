<script setup lang="ts">
import { defineAsyncComponent, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import AdminForbidden from './AdminForbidden.vue';
import '../ui/admin-density.css';
import AdminRail from './AdminRail.vue';
import AdminNavSheet from './AdminNavSheet.vue';
import AdminTopBar from './AdminTopBar.vue';
import { useNavCounts } from './overview/admin-overview.queries';
import { usePaletteShortcut } from './search/use-palette-shortcut';
import { useScreenAccess } from './use-screen-access';

/** Loaded on first open: the search and its queries stay out of the shell's first paint. */
const AdminCommandPalette = defineAsyncComponent(() => import('./search/AdminCommandPalette.vue'));

const route = useRoute();
/** Checked before the page mounts, so a forbidden screen never asks for its data. */
const isAllowed = useScreenAccess();

const navCounts = useNavCounts();
const isPhoneNavOpen = ref(false);
const isPaletteOpen = ref(false);
const hasOpenedPalette = ref(false);
function openPalette() {
  hasOpenedPalette.value = true;
  isPaletteOpen.value = true;
}
usePaletteShortcut(openPalette);

/** A chosen link closes the phone menu. */
watch(
  () => route.fullPath,
  () => (isPhoneNavOpen.value = false),
);
</script>

<template>
  <!-- The rail beside the page column, as in the public shell; the column draws its bar above `main`. -->
  <div class="flex flex-1">
    <AdminRail :counts="navCounts" @search="openPalette" />
    <AdminNavSheet v-model:open="isPhoneNavOpen" :counts="navCounts" />
    <div class="flex min-w-0 flex-1 flex-col">
      <AdminTopBar
        :is-nav-open="isPhoneNavOpen"
        @search="openPalette"
        @menu="isPhoneNavOpen = true"
      />
      <main id="main" tabindex="-1" class="relative min-w-0 flex-1 focus-visible:outline-none">
        <!-- No width cap: tables use the width; a form page caps itself (880 px). -->
        <div class="flex w-full flex-col gap-6 px-(--qa-gutter) py-6">
          <slot v-if="isAllowed" />
          <AdminForbidden v-else />
        </div>
      </main>
    </div>
    <AdminCommandPalette v-if="hasOpenedPalette" v-model:visible="isPaletteOpen" />
  </div>
</template>
