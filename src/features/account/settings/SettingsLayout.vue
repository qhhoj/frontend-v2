<script setup lang="ts">
import { Download, Link, Palette, ShieldCheck, UserRound } from 'lucide-vue-next';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import PageHeader from '@/components/ui/PageHeader.vue';
import Tabs from '@/components/ui/Tabs.vue';
import type { TabItem } from '@/components/ui/Tabs.vue';
import type { PageCrumb } from '@/components/ui/PageHeader.vue';
import { translate } from '@/i18n';
import { useSessionStore } from '@/stores/session.store';

/** The sections; only Appearance is open to anonymous visitors. */
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
  { route: 'settings-shares', labelKey: 'settings.nav.shares', icon: Link, signedInOnly: true },
  { route: 'settings-data', labelKey: 'settings.nav.data', icon: Download, signedInOnly: true },
] as const;
const session = useSessionStore();
const route = useRoute();
const signedIn = computed(() => session.status === 'authenticated');
const sections = computed(() =>
  SECTIONS.filter((section) => signedIn.value || !section.signedInOnly),
);
const tabs = computed<TabItem[]>(() =>
  sections.value.map((section) => ({
    key: section.route,
    label: translate(section.labelKey),
    to: { name: section.route },
    icon: section.icon,
  })),
);
const current = computed(() => SECTIONS.find((section) => section.route === route.name));
/** Settings (a link once signed in), then the open section. */
const crumbs = computed<PageCrumb[]>(() => [
  {
    label: translate('pages.settings'),
    to: signedIn.value ? { name: 'settings' } : undefined,
  },
  ...(current.value ? [{ label: translate(current.value.labelKey) }] : []),
]);
</script>

<template>
  <div class="page-column">
    <PageHeader :title="$t('pages.settings')" :crumbs="crumbs" />
    <div class="flex flex-col gap-6 lg:flex-row lg:items-start">
      <Tabs v-if="tabs.length > 1" variant="rail" :items="tabs" :label="$t('settings.sections')" />
      <div class="flex min-w-0 flex-1 flex-col gap-5"><slot /></div>
    </div>
  </div>
</template>
