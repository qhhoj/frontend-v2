<script setup lang="ts">
import { useRoute } from 'vue-router';
import AppearancePanel from '@/features/appearance/AppearancePanel.vue';
import LocaleToggle from './LocaleToggle.vue';
import UserMenu from './UserMenu.vue';

const route = useRoute();
const NAV_ITEMS = [
  { path: '/', labelKey: 'nav.home' },
  { path: '/problems', labelKey: 'nav.problems' },
  { path: '/contests', labelKey: 'nav.contests' },
  { path: '/users', labelKey: 'nav.users' },
  { path: '/blog', labelKey: 'nav.blog' },
  { path: '/organizations', labelKey: 'nav.organizations' },
] as const;
/** A section stays current on its sub-pages (`/problems/aplusb` is in Problems). */
const isCurrent = (path: string) =>
  path === '/' ? route.path === '/' : route.path === path || route.path.startsWith(`${path}/`);
</script>

<template>
  <header class="relative flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-4 sm:px-8">
    <RouterLink
      to="/"
      class="flex min-h-11 items-center gap-2.5 font-display text-xl font-bold text-content"
    >
      <span aria-hidden="true" class="bg-gradient-accent inline-block size-[30px] rounded-full" />
      {{ $t('app.name') }}
    </RouterLink>
    <nav
      :aria-label="$t('nav.main')"
      class="glass order-last flex w-full gap-0.5 overflow-x-auto rounded-pill p-1 md:order-none md:w-auto"
    >
      <RouterLink
        v-for="item in NAV_ITEMS"
        :key="item.path"
        :to="item.path"
        :aria-current="isCurrent(item.path) ? 'page' : undefined"
        class="inline-flex min-h-11 items-center rounded-pill px-2 text-sm whitespace-nowrap sm:px-4 sm:text-base"
        :class="
          isCurrent(item.path)
            ? 'bg-surface-hover font-semibold text-content'
            : 'text-muted hover:text-content'
        "
      >
        {{ $t(item.labelKey) }}
      </RouterLink>
    </nav>
    <div class="ml-auto flex items-center gap-2">
      <LocaleToggle />
      <AppearancePanel />
      <UserMenu />
    </div>
  </header>
</template>
