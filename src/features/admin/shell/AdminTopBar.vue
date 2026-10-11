<script setup lang="ts">
import { House, Menu, Search, ShieldCheck } from 'lucide-vue-next';
import UserMenu from '@/features/shell/UserMenu.vue';
import { shortcutHint } from './search/use-palette-shortcut';

defineProps<{ isNavOpen: boolean }>();
defineEmits<{ search: []; menu: [] }>();
</script>

<template>
  <!-- One line at every width: below `sm` the badge, the "Quản trị" label, the search label and the back link's text give way to icons. -->
  <header
    data-testid="admin-topbar"
    class="flex items-center gap-2 border-b border-line bg-surface-strong px-4 py-2 sm:gap-4 sm:px-6 sm:py-3"
  >
    <RouterLink
      :to="{ name: 'admin-dashboard' }"
      class="flex min-h-11 shrink-0 items-center gap-2 font-display text-lg font-bold"
    >
      {{ $t('app.name') }}
      <span class="hidden font-body text-sm font-semibold text-muted sm:inline">{{
        $t('admin.shell.title')
      }}</span>
    </RouterLink>
    <span
      class="hidden items-center gap-1.5 rounded-pill bg-content px-3 py-1 text-xs font-semibold text-ground md:inline-flex"
    >
      <ShieldCheck aria-hidden="true" class="size-3.5" />{{ $t('admin.shell.staffOnly') }}
    </span>
    <button
      type="button"
      data-testid="admin-search-button"
      aria-keyshortcuts="Control+K Meta+K /"
      class="ml-auto flex min-h-(--qa-control) min-w-(--qa-control) items-center justify-center gap-2 rounded-cell border border-line-strong bg-surface-solid px-3 text-sm text-muted hover:bg-surface-hover sm:min-w-56 sm:justify-start"
      @click="$emit('search')"
    >
      <Search aria-hidden="true" class="size-4" />
      <span class="sr-only sm:not-sr-only">{{ $t('admin.shell.search.open') }}</span>
      <kbd
        aria-hidden="true"
        class="ml-auto hidden rounded-row border border-line px-1.5 font-mono text-xs sm:inline"
        >{{ shortcutHint() }}</kbd
      >
    </button>
    <RouterLink
      to="/"
      class="flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 text-sm font-semibold text-accent-text sm:underline"
    >
      <House aria-hidden="true" class="size-4 sm:hidden" />
      <span class="sr-only sm:not-sr-only">{{ $t('admin.shell.backToSite') }}</span>
    </RouterLink>
    <UserMenu />
    <button
      type="button"
      data-testid="admin-nav-open"
      aria-haspopup="dialog"
      :aria-expanded="isNavOpen"
      :aria-label="$t('admin.shell.navOpen')"
      class="flex size-11 shrink-0 items-center justify-center rounded-cell border border-line-strong bg-surface-solid hover:bg-surface-hover lg:hidden"
      @click="$emit('menu')"
    >
      <Menu aria-hidden="true" class="size-5" />
    </button>
  </header>
</template>
