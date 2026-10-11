<script setup lang="ts">
import { computed } from 'vue';
import type { OrganizationDetail } from '@/api/types/organizations';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useJoinRequestsQuery } from './organizations.queries';

const props = defineProps<{ organization: OrganizationDetail }>();
const locale = useLocaleStore();
const canAdminister = computed(() => props.organization.viewer?.canAdminister === true);
/** Page 1 of the pending queue: the same query the manage page's panel reads, so a decision updates both. */
const pending = useJoinRequestsQuery(() => props.organization.slug, 'P', 1, canAdminister);
const pendingTotal = computed(() => pending.data.value?.meta.total ?? 0);

interface OrganizationTab {
  routeName: string;
  labelKey: string;
  count?: string;
  /** An accent badge: something waits for the viewer. */
  alert?: { count: string; label: string };
}
const tabs = computed<OrganizationTab[]>(() => {
  const about = { routeName: 'organization', labelKey: 'orgs.tabs.about' };
  const members = {
    routeName: 'organization-members',
    labelKey: 'orgs.tabs.members',
    count: formatNumber(props.organization.memberCount, locale.locale),
  };
  const posts = { routeName: 'organization-posts', labelKey: 'orgs.tabs.posts' };
  // Members also see the problems and submissions, administrators the quota and "Quản lý" (the API refuses the rest).
  const problems = { routeName: 'organization-problems', labelKey: 'orgs.tabs.problems' };
  const contests = { routeName: 'organization-contests', labelKey: 'orgs.tabs.contests' };
  const submissions = { routeName: 'organization-submissions', labelKey: 'orgs.tabs.submissions' };
  const quota = { routeName: 'organization-quota', labelKey: 'orgs.tabs.quota' };
  const manage: OrganizationTab = {
    routeName: 'organization-manage',
    labelKey: 'orgs.tabs.manage',
    alert: pendingTotal.value
      ? { count: formatNumber(pendingTotal.value, locale.locale), label: 'orgAdmin.pendingBadge' }
      : undefined,
  };
  const viewer = props.organization.viewer;
  if (viewer?.canAdminister)
    return [about, members, problems, contests, posts, submissions, quota, manage];
  if (viewer?.isMember) return [about, members, problems, contests, posts, submissions];
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
      <span
        v-if="tab.alert"
        data-testid="pending-badge"
        class="ml-1.5 rounded-pill bg-accent px-2 text-sm text-on-accent"
        :aria-label="$t(tab.alert.label, { count: tab.alert.count })"
        >{{ tab.alert.count }}</span
      >
    </RouterLink>
  </nav>
</template>
