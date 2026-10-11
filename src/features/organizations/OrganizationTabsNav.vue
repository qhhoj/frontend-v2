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
  // Only administrators see the join requests and the quota; members also see the problems (the API refuses the rest).
  const requests = { routeName: 'organization-requests', labelKey: 'orgs.tabs.requests' };
  const problems = { routeName: 'organization-problems', labelKey: 'orgs.tabs.problems' };
  const contests = { routeName: 'organization-contests', labelKey: 'orgs.tabs.contests' };
  const quota = { routeName: 'organization-quota', labelKey: 'orgs.tabs.quota' };
  const manage = { routeName: 'organization-manage', labelKey: 'orgs.tabs.manage' };
  const viewer = props.organization.viewer;
  if (viewer?.canAdminister)
    return [about, members, problems, contests, posts, requests, quota, manage];
  if (viewer?.isMember) return [about, members, problems, contests, posts];
  return [about, members, contests, posts];
});
</script>

<template>
  <nav :aria-label="$t('orgs.tabsLabel')" class="flex gap-1 overflow-x-auto">
    <RouterLink
      v-for="tab in tabs"
      :key="tab.routeName"
      :to="{ name: tab.routeName, params: { slug: organization.slug } }"
      class="inline-flex min-h-11 items-center whitespace-nowrap border-b-2 border-transparent px-4 font-semibold text-muted hover:text-content"
      exact-active-class="border-accent text-accent-text"
    >
      {{ $t(tab.labelKey) }}
      <span v-if="tab.count" class="ml-1.5 rounded-pill bg-surface-hover px-2 text-sm">{{
        tab.count
      }}</span>
    </RouterLink>
  </nav>
</template>
