<script setup lang="ts">
import { Menu, Search, ShieldCheck } from 'lucide-vue-next';
import LocaleToggle from '@/features/shell/LocaleToggle.vue';
import UserMenu from '@/features/shell/UserMenu.vue';
import { shortcutHint } from './search/use-palette-shortcut';

defineProps<{ isNavOpen: boolean }>();
defineEmits<{ search: []; menu: [] }>();
</script>

<template>
  <!-- One line at every width, nothing wraps: the "Quản trị" label shows from `sm`, the locale switch from `sm`, the staff badge from `xl`; below `lg` the search is an icon button and the back link lives in the nav sheet. -->
  <header
    data-testid="admin-topbar"
    class="flex items-center gap-2 border-b border-line bg-surface-strong px-4 py-2 sm:gap-4 sm:px-6 sm:py-3"
  >
    <RouterLink
      :to="{ name: 'admin-dashboard' }"
      class="flex min-h-11 shrink-0 items-center gap-2 font-display text-lg font-bold whitespace-nowrap"
    >
      {{ $t('app.name') }}
      <span class="hidden font-body text-sm font-semibold text-muted sm:inline">{{
        $t('admin.shell.title')
      }}</span>
    </RouterLink>
    <span
      data-testid="admin-staff-badge"
      class="hidden shrink-0 items-center gap-1.5 rounded-pill bg-content px-3 py-1 text-xs font-semibold whitespace-nowrap text-ground xl:inline-flex"
    >
      <ShieldCheck aria-hidden="true" class="size-3.5" />{{ $t('admin.shell.staffOnly') }}
    </span>
    <button
      type="button"
      data-testid="admin-search-button"
      aria-keyshortcuts="Control+K Meta+K /"
      class="ml-auto flex min-h-(--qa-control) min-w-(--qa-control) shrink-0 items-center whitespace-nowrap justify-center gap-2 rounded-cell border border-line-strong bg-surface-solid px-3 text-sm text-muted hover:bg-surface-hover lg:min-w-56 lg:justify-start"
      @click="$emit('search')"
    >
      <Search aria-hidden="true" class="size-4" />
      <span class="sr-only lg:not-sr-only">{{ $t('admin.shell.search.open') }}</span>
      <kbd
        aria-hidden="true"
        class="ml-auto hidden rounded-row border border-line px-1.5 font-mono text-xs lg:inline"
        >{{ shortcutHint() }}</kbd
      >
    </button>
    <!-- Below `lg` the link to the public site lives in the nav sheet. -->
    <RouterLink
      to="/"
      class="hidden min-h-11 shrink-0 items-center text-sm font-semibold whitespace-nowrap text-accent-text underline lg:flex"
    >
      {{ $t('admin.shell.backToSite') }}
    </RouterLink>
    <!-- Below `sm` the switch lives in the phone nav sheet. -->
    <span class="hidden sm:block"><LocaleToggle /></span>
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
