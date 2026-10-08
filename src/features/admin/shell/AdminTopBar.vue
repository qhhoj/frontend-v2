<script setup lang="ts">
import { ShieldCheck } from 'lucide-vue-next';
import UserMenu from '@/features/shell/UserMenu.vue';
</script>

<template>
  <header
    data-testid="admin-topbar"
    class="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-surface-strong px-4 py-3 sm:px-6"
  >
    <RouterLink
      :to="{ name: 'admin-dashboard' }"
      class="flex min-h-11 items-center gap-2 font-display text-lg font-bold"
    >
      {{ $t('app.name') }}
      <span class="font-body text-sm font-semibold text-muted">{{ $t('admin.shell.title') }}</span>
    </RouterLink>
    <span
      class="inline-flex items-center gap-1.5 rounded-pill bg-content px-3 py-1 text-xs font-semibold text-ground"
    >
      <ShieldCheck aria-hidden="true" class="size-3.5" />{{ $t('admin.shell.staffOnly') }}
    </span>
    <span class="ml-auto flex items-center gap-3">
      <RouterLink
        to="/"
        class="min-h-11 content-center text-sm font-semibold text-accent-text underline"
      >
        {{ $t('admin.shell.backToSite') }}
      </RouterLink>
      <UserMenu />
    </span>
  </header>
</template>
