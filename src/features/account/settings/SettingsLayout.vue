<script setup lang="ts">
import { Download, Palette, ShieldCheck, UserRound } from 'lucide-vue-next';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useSessionStore } from '@/stores/session.store';

/** The four sections; only Appearance is open to anonymous visitors. */
const SECTIONS = [
  { route: 'settings', labelKey: 'settings.nav.profile', icon: UserRound, signedInOnly: true },
  {
    route: 'settings-appearance',
    labelKey: 'settings.nav.appearance',
    icon: Palette,
    signedInOnly: false,
  },
  {
    route: 'settings-security',
    labelKey: 'settings.nav.security',
    icon: ShieldCheck,
    signedInOnly: true,
  },
  { route: 'settings-data', labelKey: 'settings.nav.data', icon: Download, signedInOnly: true },
] as const;
const LINK =
  'flex min-h-11 shrink-0 items-center gap-3 rounded-pill border px-4 text-sm whitespace-nowrap no-underline lg:text-[14.5px]';
const LINK_STATE = {
  current: 'border-line-accent bg-accent-soft font-semibold text-accent-soft-text',
  other:
    'border-line bg-surface-strong font-medium text-muted hover:bg-surface-hover hover:text-content lg:border-transparent lg:bg-transparent',
} as const;

const session = useSessionStore();
const route = useRoute();
const signedIn = computed(() => session.status === 'authenticated');
const sections = computed(() =>
  SECTIONS.filter((section) => signedIn.value || !section.signedInOnly),
);
const current = computed(() => SECTIONS.find((section) => section.route === route.name));
</script>

<template>
  <div class="mx-auto flex w-full max-w-[1216px] flex-col gap-4 px-4 pt-5 pb-12 md:px-8">
    <nav
      :aria-label="$t('common.breadcrumb')"
      class="hidden items-center gap-1.5 text-[13px] sm:flex"
    >
      <RouterLink
        v-if="signedIn"
        :to="{ name: 'settings' }"
        class="inline-flex min-h-11 items-center text-accent-text"
      >
        {{ $t('pages.settings') }}
      </RouterLink>
      <span v-else>{{ $t('pages.settings') }}</span>
      <span aria-hidden="true" class="text-muted">/</span>
      <span v-if="current" aria-current="page" class="text-muted">{{ $t(current.labelKey) }}</span>
    </nav>
    <h1 class="-mt-3 font-display text-[28px] leading-tight font-bold sm:text-[34px]">
      {{ $t('pages.settings') }}
    </h1>
    <div class="flex flex-col gap-6 lg:flex-row lg:items-start">
      <nav
        v-if="sections.length > 1"
        :aria-label="$t('settings.sections')"
        class="flex gap-1.5 overflow-x-auto py-1 lg:glass lg:w-60 lg:shrink-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:rounded-card lg:p-2.5"
      >
        <RouterLink
          v-for="section in sections"
          :key="section.route"
          :to="{ name: section.route }"
          :class="[LINK, LINK_STATE[section.route === route.name ? 'current' : 'other']]"
        >
          <component :is="section.icon" aria-hidden="true" class="size-[18px] shrink-0" />
          {{ $t(section.labelKey) }}
        </RouterLink>
      </nav>
      <div class="flex min-w-0 flex-1 flex-col gap-5"><slot /></div>
    </div>
  </div>
</template>
