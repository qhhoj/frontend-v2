<script setup lang="ts">
import { computed } from 'vue';
import type { OrganizationDetail } from '@/api/types/organizations';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';

const props = defineProps<{ organization: OrganizationDetail }>();
const locale = useLocaleStore();

interface OrganizationTab {
  routeName: string;
  labelKey: string;
  count?: string;
}
const tabs = computed<OrganizationTab[]>(() => {
  const about = { routeName: 'organization', labelKey: 'orgs.tabs.about' };
  const members = {
    routeName: 'organization-members',
    labelKey: 'orgs.tabs.members',
    count: formatNumber(props.organization.memberCount, locale.locale),
  };
  const posts = { routeName: 'organization-posts', labelKey: 'orgs.tabs.posts' };
  // Only administrators see the join requests (the API refuses the rest).
  const requests = { routeName: 'organization-requests', labelKey: 'orgs.tabs.requests' };
  return props.organization.viewer?.canAdminister
    ? [about, members, posts, requests]
    : [about, members, posts];
});
</script>

<template>
  <nav :aria-label="$t('orgs.tabsLabel')" class="flex gap-1 overflow-x-auto border-b border-line">
    <RouterLink
      v-for="tab in tabs"
      :key="tab.routeName"
      :to="{ name: tab.routeName, params: { slug: organization.slug } }"
      class="inline-flex min-h-11 items-center whitespace-nowrap border-b-2 border-transparent px-4 font-semibold text-muted hover:text-content"
      exact-active-class="border-accent text-content"
    >
      {{ $t(tab.labelKey) }}
      <span v-if="tab.count" class="ml-1.5 rounded-pill bg-surface-hover px-2 text-sm">{{
        tab.count
      }}</span>
    </RouterLink>
  </nav>
</template>
