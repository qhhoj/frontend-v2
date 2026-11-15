<script setup lang="ts">
import { House, Search } from 'lucide-vue-next';
import { nextTick, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import AppButton from '@/components/ui/AppButton.vue';
import BrandWordmark from '@/components/ui/BrandWordmark.vue';
import UserMenu from '@/features/shell/UserMenu.vue';
import { shortcutHint } from '@/lib/shortcut-hint';
import AdminNav from './AdminNav.vue';
import type { AdminNavId } from './admin-nav';
import type { NavCount } from './overview/admin-overview.queries';

/**
 * The admin side rail, from `lg` up, in the look of the public rail (opaque, 224 px, the page background shows behind the
 * page column only): the brand with "Quản trị", the search button (Ctrl K), the sections from `admin-nav.ts`, the way back
 * to the site and the account at the foot. Below `lg` the top bar's menu button opens the same nav as a sheet.
 */
defineProps<{ counts: Partial<Record<AdminNavId, NavCount>> }>();
defineEmits<{ search: [] }>();

const route = useRoute();
const navBox = ref<HTMLElement | null>(null);
/** The nav scrolls inside the rail: bring the current row into view on load and on each route change. */
async function showCurrent() {
  await nextTick();
  navBox.value?.querySelector('[aria-current="page"]')?.scrollIntoView?.({ block: 'nearest' });
}
onMounted(showCurrent);
watch(() => route.path, showCurrent);
</script>

<template>
  <aside
    data-testid="admin-rail"
    :aria-label="$t('admin.shell.railLabel')"
    class="sticky top-0 hidden h-dvh w-(--qh-rail) shrink-0 flex-col gap-3 overflow-hidden border-r border-line bg-surface-strong px-3 py-2 rail-wide:flex print:hidden"
  >
    <div class="flex min-h-11 items-center gap-2 px-1">
      <BrandWordmark size="sm" :to="{ name: 'admin-dashboard' }" />
      <span class="text-sm font-semibold text-muted">{{ $t('admin.shell.title') }}</span>
    </div>
    <AppButton
      tone="plain"
      data-testid="admin-search-button"
      aria-keyshortcuts="Control+K Meta+K /"
      class="flex h-9 items-center gap-2 rounded-control border border-line-control bg-surface-solid px-2.5 text-sm text-muted transition-colors hover:text-content touch:h-11"
      @click="$emit('search')"
    >
      <Search aria-hidden="true" class="size-4 shrink-0" />
      <span class="flex-1 truncate text-left">{{ $t('search.title') }}</span>
      <kbd class="rounded-cell border border-line px-1.5 font-mono text-caption leading-5">{{
        shortcutHint()
      }}</kbd>
    </AppButton>
    <div ref="navBox" class="-mx-1 min-h-0 flex-1 overflow-y-auto overscroll-contain px-1">
      <AdminNav :counts="counts" />
    </div>
    <div class="flex flex-col gap-1 border-t border-line pt-2">
      <RouterLink
        to="/"
        class="flex min-h-9 items-center gap-3 rounded-row px-2.5 text-sm font-semibold text-secondary transition-colors hover:bg-surface-hover hover:text-content touch:min-h-11"
      >
        <House aria-hidden="true" class="size-4 shrink-0" />{{ $t('admin.shell.backToSite') }}
      </RouterLink>
      <UserMenu variant="row" />
    </div>
  </aside>
</template>
