<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import PillTabs, { type PillTab } from '@/components/PillTabs.vue';
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

const { t } = useI18n();

interface OrganizationTab {
  routeName: string;
  labelKey: string;
  badge?: PillTab['badge'];
}
const visibleTabs = computed<OrganizationTab[]>(() => {
  const about = { routeName: 'organization', labelKey: 'orgs.tabs.about' };
  const members: OrganizationTab = {
    routeName: 'organization-members',
    labelKey: 'orgs.tabs.members',
    badge: { text: formatNumber(props.organization.memberCount, locale.locale), tone: 'neutral' },
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
    badge: pendingTotal.value
      ? {
          text: formatNumber(pendingTotal.value, locale.locale),
          tone: 'accent',
          srLabel: t('orgAdmin.pendingBadge', {
            count: formatNumber(pendingTotal.value, locale.locale),
          }),
        }
      : undefined,
  };
  const viewer = props.organization.viewer;
  if (viewer?.canAdminister)
    return [about, members, problems, contests, posts, submissions, quota, manage];
  if (viewer?.isMember) return [about, members, problems, contests, posts, submissions];
  return [about, members, contests, posts];
});
const tabs = computed<PillTab[]>(() =>
  visibleTabs.value.map((tab) => ({
    key: tab.routeName,
    label: t(tab.labelKey),
    to: { name: tab.routeName, params: { slug: props.organization.slug } },
    badge: tab.badge,
  })),
);
</script>

<template>
  <PillTabs :tabs="tabs" :label="t('orgs.tabsLabel')" />
</template>
