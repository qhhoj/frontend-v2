<script setup lang="ts">
import { Menu, Search, ShieldCheck } from 'lucide-vue-next';
import BrandWordmark from '@/components/ui/BrandWordmark.vue';
import IconButton from '@/components/ui/IconButton.vue';
import AppearancePanel from '@/features/appearance/AppearancePanel.vue';
import LocaleToggle from '@/features/shell/LocaleToggle.vue';
import UserMenu from '@/features/shell/UserMenu.vue';

defineProps<{ isNavOpen: boolean }>();
defineEmits<{ search: []; menu: [] }>();
</script>

<template>
  <!-- The bar over the page column, opaque like the public one: 56 px on a phone (menu, brand, search, account), 48 px from `lg`, where the rail holds the brand, search and account and the bar keeps the area label, language and look. -->
  <header
    data-testid="admin-topbar"
    class="flex h-14 items-center gap-1 border-b border-line bg-surface-solid px-2 rail-wide:h-12 rail-wide:gap-3 rail-wide:px-6 print:hidden"
  >
    <IconButton
      data-testid="admin-nav-open"
      aria-haspopup="dialog"
      :aria-expanded="isNavOpen"
      :label="$t('admin.shell.navOpen')"
      class="rail-wide:hidden"
      @click="$emit('menu')"
    >
      <Menu aria-hidden="true" class="size-5" />
    </IconButton>
    <BrandWordmark size="sm" :to="{ name: 'admin-dashboard' }" class="px-1 rail-wide:hidden" />
    <span class="truncate text-sm font-semibold text-muted rail-wide:hidden">{{
      $t('admin.shell.title')
    }}</span>
    <span
      data-testid="admin-staff-badge"
      class="hidden items-center gap-1.5 text-sm font-semibold text-muted rail-wide:inline-flex"
    >
      <ShieldCheck aria-hidden="true" class="size-4" />{{ $t('admin.shell.staffOnly') }}
    </span>
    <div class="ml-auto flex shrink-0 items-center gap-1">
      <IconButton
        :label="$t('admin.shell.search.open')"
        class="rail-wide:hidden"
        @click="$emit('search')"
      >
        <Search aria-hidden="true" class="size-5" />
      </IconButton>
      <!-- Below `sm` the language switch lives in the phone nav sheet. -->
      <span class="hidden sm:block"><LocaleToggle /></span>
      <span class="hidden rail-wide:block"><AppearancePanel /></span>
      <span class="rail-wide:hidden"><UserMenu /></span>
    </div>
  </header>
</template>
